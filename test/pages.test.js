/**
 * Tests for page generators
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { generate100 } from '../src/pages/100-index.js';
import { generate101, generate102, generate103 } from '../src/pages/1xx-news.js';
import { generate400 } from '../src/pages/4xx-weather.js';
import { generate500 } from '../src/pages/5xx-tech.js';
import { generate666 } from '../src/pages/666-haunted.js';
import { generate404 } from '../src/pages/404.js';
import { getPage, getAvailablePages } from '../src/pages/index.js';
import { Cache } from '../src/sources/cache.js';

/**
 * Helper: verify page structure
 */
function assertValidPage(page, expectedNumber) {
  assert.strictEqual(page.number, expectedNumber, `Page number should be ${expectedNumber}`);
  assert.strictEqual(page.cells.length, 24, 'Page should have 24 rows');

  for (let row = 0; row < 24; row++) {
    assert.strictEqual(page.cells[row].length, 40, `Row ${row} should have 40 columns`);

    for (let col = 0; col < 40; col++) {
      const cell = page.cells[row][col];
      assert(typeof cell.ch === 'string', `Cell [${row}][${col}] ch should be string`);
      assert(cell.ch.length === 1, `Cell [${row}][${col}] ch should be 1 character`);
      assert.strictEqual(typeof cell.fg, 'number', `Cell [${row}][${col}] fg should be number`);
      assert.strictEqual(typeof cell.bg, 'number', `Cell [${row}][${col}] bg should be number`);
      assert(cell.fg >= 0 && cell.fg <= 7, `Cell [${row}][${col}] fg should be 0-7`);
      assert(cell.bg >= 0 && cell.bg <= 7, `Cell [${row}][${col}] bg should be 0-7`);
      assert.strictEqual(typeof cell.flags, 'number', `Cell [${row}][${col}] flags should be number`);
    }
  }
}

/**
 * Mock fetch function for testing
 */
function createMockFetch(data) {
  return async (url) => {
    // Try exact match first, then prefix match
    let matchedData = data[url];

    // For URLs with query params, try prefix matching
    if (!matchedData) {
      for (const [key, value] of Object.entries(data)) {
        if (url.startsWith(key)) {
          matchedData = value;
          break;
        }
      }
    }

    if (matchedData) {
      return {
        ok: true,
        status: 200,
        text: async () => matchedData.text || '',
        json: async () => matchedData.json || {}
      };
    }
    return {
      ok: false,
      status: 404,
      text: async () => '',
      json: async () => ({})
    };
  };
}

/**
 * Create test context
 */
function createTestContext(mockData = {}) {
  return {
    cache: new Cache(),
    fetch: createMockFetch(mockData)
  };
}

// Test page 100 (index)
test('Page 100 — Index', async () => {
  const ctx = createTestContext();
  const pages = await generate100(ctx);
  assert.strictEqual(pages.length, 1, 'Should return 1 page');
  assertValidPage(pages[0], 100);

  // Check header row contains "Ghostext"
  const headerText = pages[0].cells[0].map(c => c.ch).join('').trim();
  assert(headerText.includes('Ghostext'), 'Header should contain "Ghostext"');
});

// Test page 101 (news)
test('Page 101 — BBC News (with mock data)', async () => {
  const mockRssData = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item><title>First headline</title></item>
    <item><title>Second headline</title></item>
    <item><title>Third headline</title></item>
  </channel>
</rss>`;

  const ctx = createTestContext({
    'https://feeds.bbci.co.uk/news/rss.xml': { text: mockRssData }
  });

  const pages = await generate101(ctx);
  assert.strictEqual(pages.length, 1, 'Should return 1 page');
  assertValidPage(pages[0], 101);

  // Check content contains headline text
  const pageText = pages[0].cells.map(row => row.map(c => c.ch).join('')).join('\n');
  assert(pageText.includes('First headline'), 'Page should contain first headline');
});

// Test page 102 (news pagination)
test('Page 102 — BBC News pagination', async () => {
  const ctx = createTestContext();
  const pages = await generate102(ctx);
  assertValidPage(pages[0], 102);
});

// Test page 103 (news pagination)
test('Page 103 — BBC News pagination', async () => {
  const ctx = createTestContext();
  const pages = await generate103(ctx);
  assertValidPage(pages[0], 103);
});

// Test page 400 (weather)
test('Page 400 — Weather', async () => {
  const mockWeatherData = {
    current: {
      temperature_2m: 22.5,
      relative_humidity_2m: 65,
      weather_code: 0
    }
  };

  const ctx = createTestContext({
    'https://api.open-meteo.com/v1/forecast?latitude=28.6139': { json: mockWeatherData },
    'https://api.open-meteo.com/v1/forecast?latitude=51.5074': { json: mockWeatherData },
    'https://api.open-meteo.com/v1/forecast?latitude=40.7128': { json: mockWeatherData }
  });

  const pages = await generate400(ctx);
  assertValidPage(pages[0], 400);

  // Check content contains city names
  const pageText = pages[0].cells.map(row => row.map(c => c.ch).join('')).join('\n');
  assert(pageText.includes('DELHI'), 'Page should contain Delhi');
  assert(pageText.includes('LONDON'), 'Page should contain London');
  assert(pageText.includes('NEW YORK'), 'Page should contain New York');
});

// Test page 500 (Hacker News)
test('Page 500 — Hacker News', async () => {
  const mockHNData = [
    { title: 'Amazing story', score: 500 },
    { title: 'Cool project', score: 300 }
  ];

  const ctx = createTestContext({
    'https://hacker-news.firebaseio.com/v0/topstories.json':
      { json: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    'https://hacker-news.firebaseio.com/v0/item/1.json':
      { json: { title: 'Amazing story', score: 500 } },
    'https://hacker-news.firebaseio.com/v0/item/2.json':
      { json: { title: 'Cool project', score: 300 } }
  });

  const pages = await generate500(ctx);
  assertValidPage(pages[0], 500);
});

// Test page 666 (haunted)
test('Page 666 — The Haunted Index', async () => {
  const ctx = createTestContext();
  const pages = await generate666(ctx);
  assert.strictEqual(pages.length, 1, 'Should return 1 page');
  assertValidPage(pages[0], 666);

  // Check content contains spooky elements
  const pageText = pages[0].cells.map(row => row.map(c => c.ch).join('')).join('\n');
  assert(pageText.includes('HAUNTED'), 'Page should contain HAUNTED');
});

// Test page 404 (not found)
test('Page 404 — Dead Page', async () => {
  const ctx = createTestContext();
  const pages = await generate404(ctx);
  assert.strictEqual(pages.length, 1, 'Should return 1 page');
  assertValidPage(pages[0], 404);

  // Check content
  const pageText = pages[0].cells.map(row => row.map(c => c.ch).join('')).join('\n');
  assert(pageText.includes('PASSED OVER'), 'Page should contain "PASSED OVER"');
});

// Test page registry
test('Page registry — getPage', async () => {
  const ctx = createTestContext();

  // Test existing page
  const page100 = await getPage(100, ctx);
  assertValidPage(page100, 100);

  // Test non-existent page returns 404
  const page999 = await getPage(999, ctx);
  assertValidPage(page999, 404);
});

// Test available pages list
test('Page registry — getAvailablePages', () => {
  const available = getAvailablePages();
  assert(Array.isArray(available), 'Should return array');
  assert(available.includes(100), 'Should include page 100');
  assert(available.includes(101), 'Should include page 101');
  assert(available.includes(666), 'Should include page 666');
  assert(!available.includes(404), 'Should not include page 404');
});

// Property-based test: all pages are exactly 24x40
test('Property-based: All generated pages are exactly 24x40', async () => {
  const generators = [
    [100, generate100],
    [101, generate101],
    [102, generate102],
    [103, generate103],
    [400, generate400],
    [500, generate500],
    [666, generate666],
    [404, generate404]
  ];

  const ctx = createTestContext();

  for (const [pageNum, generator] of generators) {
    const pages = await generator(ctx);
    assert(pages.length > 0, `Generator should return at least one page for ${pageNum}`);

    for (const page of pages) {
      assert.strictEqual(page.cells.length, 24, `Page ${pageNum} should have exactly 24 rows`);

      for (let row = 0; row < 24; row++) {
        assert.strictEqual(
          page.cells[row].length,
          40,
          `Page ${pageNum} row ${row} should have exactly 40 columns`
        );
      }
    }
  }
});

// Test with offline fixtures (no network calls)
test('Page generators handle missing data gracefully', async () => {
  const ctx = createTestContext({}); // Empty mock data

  // These should not throw even without network data
  const pages = [
    await generate101(ctx),
    await generate102(ctx),
    await generate103(ctx),
    await generate400(ctx),
    await generate500(ctx)
  ];

  for (const pageArray of pages) {
    assert(pageArray.length > 0, 'Should return pages even without network data');
    assertValidPage(pageArray[0], pageArray[0].number);
  }
});
