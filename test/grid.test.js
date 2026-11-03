import { test } from 'node:test';
import assert from 'node:assert';
import {
  createPage,
  transliterate,
  wordWrap,
  writeText,
  setHeader,
  setFastext,
  formatHeaderClock,
  COLOURS,
  FLAGS
} from '../src/grid.js';

test('createPage returns 24×40 grid', () => {
  const page = createPage(100);
  assert.strictEqual(page.number, 100);
  assert.strictEqual(page.subpage, 1);
  assert.strictEqual(page.subpageCount, 1);
  assert.strictEqual(page.cells.length, 24);
  for (const row of page.cells) {
    assert.strictEqual(row.length, 40);
    for (const cell of row) {
      assert.strictEqual(cell.ch, ' ');
      assert.strictEqual(cell.fg, COLOURS.WHITE);
      assert.strictEqual(cell.bg, COLOURS.BLACK);
      assert.strictEqual(cell.flags, 0);
    }
  }
});

test('createPage with custom subpage params', () => {
  const page = createPage(101, 2, 3);
  assert.strictEqual(page.number, 101);
  assert.strictEqual(page.subpage, 2);
  assert.strictEqual(page.subpageCount, 3);
});

test('transliterate handles smart quotes', () => {
  const result = transliterate('\u2018Hello\u2019');
  assert.strictEqual(result, "'Hello'");
});

test('transliterate handles em-dash', () => {
  const result = transliterate('foo\u2014bar');
  assert.strictEqual(result, 'foo-bar');
});

test('transliterate handles ellipsis', () => {
  const result = transliterate('wait\u2026');
  assert.strictEqual(result, 'wait...');
});

test('transliterate handles empty string', () => {
  const result = transliterate('');
  assert.strictEqual(result, '');
});

test('transliterate replaces control characters', () => {
  const result = transliterate('hello\x00world\x1F');
  assert.strictEqual(result, 'hello world ');
});

test('wordWrap short text fits on one line', () => {
  const result = wordWrap('hello world', 20);
  assert.deepStrictEqual(result, ['hello world']);
});

test('wordWrap wraps long text', () => {
  const result = wordWrap('one two three four five', 10);
  assert.deepStrictEqual(result, ['one two', 'three four', 'five']);
});

test('wordWrap truncates single word exceeding width', () => {
  const result = wordWrap('supercalifragilisticexpialidocious', 10);
  assert.deepStrictEqual(result, ['supercali…']);
});

test('wordWrap empty string returns empty array', () => {
  const result = wordWrap('', 10);
  assert.deepStrictEqual(result, []);
});

test('wordWrap zero width returns empty array', () => {
  const result = wordWrap('hello', 0);
  assert.deepStrictEqual(result, []);
});

test('wordWrap handles multiple spaces', () => {
  const result = wordWrap('hello    world', 20);
  assert.deepStrictEqual(result, ['hello world']);
});

test('writeText writes text to page at position', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'Hello', COLOURS.RED, COLOURS.BLACK, 40);
  assert.strictEqual(page.cells[1][0].ch, 'H');
  assert.strictEqual(page.cells[1][0].fg, COLOURS.RED);
  assert.strictEqual(page.cells[1][1].ch, 'e');
  assert.strictEqual(page.cells[1][2].ch, 'l');
  assert.strictEqual(page.cells[1][3].ch, 'l');
  assert.strictEqual(page.cells[1][4].ch, 'o');
});

test('writeText wraps text to multiple rows', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'one two three four five', COLOURS.WHITE, COLOURS.BLACK, 10);
  assert.strictEqual(page.cells[1][0].ch, 'o');
  assert.strictEqual(page.cells[2][0].ch, 't');
  assert.strictEqual(page.cells[3][0].ch, 'f');
});

test('writeText respects maxWidth', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'hello world', COLOURS.WHITE, COLOURS.BLACK, 6);
  assert.strictEqual(page.cells[1][0].ch, 'h');
  assert.strictEqual(page.cells[2][0].ch, 'w');
});

test('writeText stops at page boundary', () => {
  const page = createPage(100);
  const longText = 'a'.repeat(1000);
  writeText(page, 22, 0, longText, COLOURS.WHITE, COLOURS.BLACK, 40);
  assert.strictEqual(page.cells[23][0].ch, ' '); // Row 23 should still be empty
});

test('setHeader writes service name, page, and time', () => {
  const page = createPage(100);
  setHeader(page, 'BBC News', 100, 'Sun 1 Nov  12:34:56');
  
  // Check header format: " P100  BBC News       Sun 1 Nov  12:34:56" (truncated to 40 chars)
  const headerText = page.cells[0].map(c => c.ch).join('');
  assert.ok(headerText.includes('P100'));
  assert.ok(headerText.includes('BBC News'));
  assert.ok(headerText.includes('Sun 1 Nov'));
  // Time may be truncated due to 40-char limit, so just check it starts
  assert.ok(headerText.includes('12:34'));
});

test('setFastext writes coloured links', () => {
  const page = createPage(100);
  setFastext(page, 101, 400, 500, 666);
  
  // Check red link background at start
  for (let i = 0; i < 10; i++) {
    assert.strictEqual(page.cells[23][i].bg, COLOURS.RED);
  }
  
  // Check green link background
  for (let i = 10; i < 20; i++) {
    assert.strictEqual(page.cells[23][i].bg, COLOURS.GREEN);
  }
  
  // Check yellow link background
  for (let i = 20; i < 30; i++) {
    assert.strictEqual(page.cells[23][i].bg, COLOURS.YELLOW);
  }
  
  // Check cyan link background
  for (let i = 30; i < 40; i++) {
    assert.strictEqual(page.cells[23][i].bg, COLOURS.CYAN);
  }
});

test('formatHeaderClock returns 16-character timestamp', () => {
  const date = new Date('2026-11-03T06:31:00Z');
  const result = formatHeaderClock(date);
  assert.strictEqual(result.length, 16, 'Clock format should be exactly 16 characters');
  // Format: "Tue 03 Nov 06:31"
  assert.match(result, /^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/);
});

test('formatHeaderClock formats with timezone', () => {
  // Set timezone for test
  const oldTz = process.env.GHOSTEXT_TZ;
  try {
    process.env.GHOSTEXT_TZ = 'UTC';
    const date = new Date('2026-11-03T06:31:00Z');
    const result = formatHeaderClock(date);
    // Should be "Tue 03 Nov 06:31" in UTC
    assert.ok(result.includes('Tue'));
    assert.ok(result.includes('03'));
    assert.ok(result.includes('Nov'));
    assert.ok(result.includes('06:31'));
  } finally {
    if (oldTz !== undefined) {
      process.env.GHOSTEXT_TZ = oldTz;
    } else {
      delete process.env.GHOSTEXT_TZ;
    }
  }
});

test('setHeader right-aligns clock and fits exactly 40 columns', () => {
  const page = createPage(100);
  const clockText = 'Tue 03 Nov 06:31'; // 16 chars
  setHeader(page, 'BBC News', 100, clockText);
  
  // Check that header is exactly 40 columns
  const headerRow = page.cells[0];
  assert.strictEqual(headerRow.length, 40, 'Header should be exactly 40 columns');
  
  // Check that all cells are filled
  for (let i = 0; i < 40; i++) {
    assert.strictEqual(typeof headerRow[i].ch, 'string', `Cell [0][${i}] should have a character`);
  }
  
  // Check that clock is at the end (right-aligned)
  const headerText = headerRow.map(c => c.ch).join('');
  assert.ok(headerText.includes('BBC News'), 'Header should contain service name');
  assert.ok(headerText.includes('P100'), 'Header should contain page number');
  assert.ok(headerText.endsWith(clockText), 'Clock should be right-aligned at the end');
});

test('setHeader truncates long service name', () => {
  const page = createPage(100);
  const longServiceName = 'This is an extremely long service name that should be truncated';
  const clockText = 'Tue 03 Nov 06:31';
  setHeader(page, longServiceName, 100, clockText);
  
  // Check that header is still exactly 40 columns
  const headerRow = page.cells[0];
  assert.strictEqual(headerRow.length, 40);
  
  // All cells should be filled
  for (let i = 0; i < 40; i++) {
    assert.strictEqual(typeof headerRow[i].ch, 'string');
  }
  
  // Header should end with the clock
  const headerText = headerRow.map(c => c.ch).join('');
  assert.ok(headerText.endsWith(clockText), 'Clock should still be right-aligned');
  assert.ok(headerText.includes('P100'), 'Page number should be present');
});

test('transliterate handles bullet U+2022', () => {
  const result = transliterate('\u2022');
  assert.strictEqual(result, '*');
});

test('transliterate handles middle dot U+00B7', () => {
  const result = transliterate('\u00B7');
  assert.strictEqual(result, '*');
});

test('transliterate handles black circle U+25CF', () => {
  const result = transliterate('\u25CF');
  assert.strictEqual(result, '*');
});

test('transliterate handles bullets in text', () => {
  const result = transliterate('• headline one');
  assert.strictEqual(result, '* headline one');
});

test('transliterate preserves ellipsis as three dots', () => {
  const result = transliterate('wait\u2026 loading');
  assert.strictEqual(result, 'wait... loading');
});
