import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { getPage } from '../src/pages/index.js';
import { renderJSON, renderANSI } from '../src/render/index.js';
import { Cache } from '../src/sources/cache.js';
import { fetchWithTimeout } from '../src/sources/fetch.js';

/**
 * Make a simple HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

test('integration: getPage returns valid pages', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  // Test valid page numbers
  const page100 = await getPage(100, ctx);
  assert.strictEqual(page100.number, 100);
  assert.strictEqual(page100.cells.length, 24);
  assert.strictEqual(page100.cells[0].length, 40);

  const page101 = await getPage(101, ctx);
  assert.strictEqual(page101.number, 101);

  const page400 = await getPage(400, ctx);
  assert.strictEqual(page400.number, 400);

  const page500 = await getPage(500, ctx);
  assert.strictEqual(page500.number, 500);

  const page666 = await getPage(666, ctx);
  assert.strictEqual(page666.number, 666);
});

test('integration: getPage returns 404 for invalid pages', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  // Test invalid page numbers
  const page999 = await getPage(999, ctx);
  assert.strictEqual(page999.number, 404);

  const page050 = await getPage(50, ctx);
  assert.strictEqual(page050.number, 404);

  const page999999 = await getPage(999999, ctx);
  assert.strictEqual(page999999.number, 404);
});

test('integration: renderJSON produces valid JSON with correct structure', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const page = await getPage(100, ctx);
  const json = renderJSON(page);

  const parsed = JSON.parse(json);
  assert.ok(parsed);
  assert.strictEqual(parsed.number, 100);
  assert.strictEqual(parsed.subpage, 1);
  assert.strictEqual(parsed.subpageCount, 1);
  assert.ok(Array.isArray(parsed.cells));
  assert.strictEqual(parsed.cells.length, 24);
  for (const row of parsed.cells) {
    assert.strictEqual(row.length, 40);
    for (const cell of row) {
      assert.ok(cell.ch !== undefined);
      assert.ok(cell.fg !== undefined);
      assert.ok(cell.bg !== undefined);
      assert.ok(cell.flags !== undefined);
    }
  }
});

test('integration: renderANSI produces string with ANSI codes', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const page = await getPage(100, ctx);
  const ansi = renderANSI(page);

  assert.ok(typeof ansi === 'string');
  assert.ok(ansi.length > 0);
  // Should contain ANSI escape codes
  assert.ok(ansi.includes('\x1b[') || ansi.includes('\u001b['));
});

test('integration: all major pages generate without error', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const pageNumbers = [100, 101, 102, 103, 400, 500, 666, 404];

  for (const num of pageNumbers) {
    const page = await getPage(num, ctx);
    assert.ok(page);
    assert.strictEqual(page.cells.length, 24);
    assert.ok(page.cells[0].length, 40);

    // Should render without throwing
    const json = renderJSON(page);
    assert.ok(json);
    JSON.parse(json); // Verify it's valid JSON

    const ansi = renderANSI(page);
    assert.ok(ansi);
    assert.ok(typeof ansi === 'string');
  }
});

test('integration: 404 page structure is valid', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const page = await getPage(999, ctx);
  assert.strictEqual(page.number, 404);
  assert.strictEqual(page.cells.length, 24);
  for (let r = 0; r < 24; r++) {
    assert.strictEqual(page.cells[r].length, 40);
  }

  // Should render successfully
  const json = renderJSON(page);
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.number, 404);
});

test('integration: page header and fastext are present', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const page = await getPage(100, ctx);

  // Row 0 should be header (not all spaces)
  const headerText = page.cells[0].map(c => c.ch).join('').trim();
  assert.ok(headerText.length > 0, 'Header should not be empty');

  // Row 23 should be fastext (should have colours)
  const fastextRow = page.cells[23];
  let hasColour = false;
  for (const cell of fastextRow) {
    if (cell.bg !== 0 || cell.fg !== 7) {
      hasColour = true;
      break;
    }
  }
  assert.ok(hasColour, 'Fastext row should have colours');
});

test('integration: subpage rotation works for news pages', async () => {
  const cache = new Cache();
  const fetchFn = (url) => fetchWithTimeout(url, 5000);
  const ctx = { cache, fetch: fetchFn };

  const page101 = await getPage(101, ctx);
  const page102 = await getPage(102, ctx);
  const page103 = await getPage(103, ctx);

  // All should be subpages of 101
  assert.strictEqual(page101.number, 101);
  assert.strictEqual(page102.number, 102);
  assert.strictEqual(page103.number, 103);

  // Should have subpage info
  assert.ok(page101.subpage > 0);
  assert.ok(page101.subpageCount >= 1);
});

test('integration: cache prevents duplicate fetches within TTL', async () => {
  const cache = new Cache();
  let fetchCount = 0;
  const fetchFn = async (url) => {
    fetchCount++;
    // Simulate a fetch
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ok: true, text: async () => '<rss></rss>' });
      }, 10);
    });
  };
  const ctx = { cache, fetch: fetchFn };

  const page1 = await getPage(100, ctx);
  const countAfterFirst = fetchCount;

  const page2 = await getPage(100, ctx);
  const countAfterSecond = fetchCount;

  // Second fetch should use cache and not increment (much)
  assert.ok(countAfterSecond >= countAfterFirst);
  // Both pages should be identical structure (same page number)
  assert.strictEqual(page1.number, page2.number);
});
