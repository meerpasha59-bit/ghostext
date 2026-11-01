import { test } from 'node:test';
import assert from 'node:assert';
import { renderHTML, renderANSI, renderJSON } from '../src/render/index.js';
import { createPage, writeText, COLOURS } from '../src/grid.js';

test('renderHTML produces valid structure', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'Hello', COLOURS.RED, COLOURS.BLACK, 40);
  
  const html = renderHTML(page);
  
  assert.ok(html.includes('teletext-grid'));
  assert.ok(html.includes('row'));
  assert.ok(html.includes('cell'));
  assert.ok(html.includes('fg-'));
  assert.ok(html.includes('bg-'));
  assert.ok(html.includes('H'));
  assert.ok(html.includes('e'));
  assert.ok(html.includes('l'));
  assert.ok(html.includes('o'));
});

test('renderHTML contains 24 rows', () => {
  const page = createPage(100);
  const html = renderHTML(page);
  
  const rowMatches = html.match(/class="row"/g);
  assert.strictEqual(rowMatches.length, 24);
});

test('renderHTML contains 960 cells (24×40)', () => {
  const page = createPage(100);
  const html = renderHTML(page);
  
  const cellMatches = html.match(/class="cell/g);
  assert.strictEqual(cellMatches.length, 960);
});

test('renderHTML escapes HTML special characters', () => {
  const page = createPage(100);
  page.cells[0][0].ch = '<';
  page.cells[0][1].ch = '>';
  page.cells[0][2].ch = '&';
  
  const html = renderHTML(page);
  
  assert.ok(html.includes('&lt;'));
  assert.ok(html.includes('&gt;'));
  assert.ok(html.includes('&amp;'));
});

test('renderHTML applies correct colour classes', () => {
  const page = createPage(100);
  page.cells[1][0].fg = COLOURS.RED;
  page.cells[1][0].bg = COLOURS.YELLOW;
  
  const html = renderHTML(page);
  
  assert.ok(html.includes('fg-1'));
  assert.ok(html.includes('bg-3'));
});

test('renderANSI produces string with ANSI codes', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'Test', COLOURS.GREEN, COLOURS.BLACK, 40);
  
  const ansi = renderANSI(page);
  
  assert.ok(typeof ansi === 'string');
  assert.ok(ansi.includes('\x1b['));
  assert.ok(ansi.includes('\x1b[0m')); // Reset at end
});

test('renderANSI contains newlines', () => {
  const page = createPage(100);
  const ansi = renderANSI(page);
  
  const lines = ansi.split('\n');
  assert.strictEqual(lines.length, 25); // 24 rows + final reset line
});

test('renderANSI contains characters', () => {
  const page = createPage(100);
  page.cells[0][0].ch = 'A';
  page.cells[0][1].ch = 'B';
  
  const ansi = renderANSI(page);
  
  assert.ok(ansi.includes('A'));
  assert.ok(ansi.includes('B'));
});

test('renderANSI uses correct colour codes', () => {
  const page = createPage(100);
  page.cells[0][0].fg = COLOURS.RED; // 31
  page.cells[0][0].bg = COLOURS.GREEN; // 42
  
  const ansi = renderANSI(page);
  
  assert.ok(ansi.includes('\x1b[31m'));
  assert.ok(ansi.includes('\x1b[42m'));
});

test('renderJSON produces valid JSON', () => {
  const page = createPage(100);
  writeText(page, 1, 0, 'Test', COLOURS.WHITE, COLOURS.BLACK, 40);
  
  const json = renderJSON(page);
  
  // Should be parseable
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.number, 100);
  assert.strictEqual(parsed.subpage, 1);
  assert.strictEqual(parsed.subpageCount, 1);
  assert.ok(Array.isArray(parsed.cells));
});

test('renderJSON includes page metadata', () => {
  const page = createPage(101, 2, 3);
  const json = renderJSON(page);
  const parsed = JSON.parse(json);
  
  assert.strictEqual(parsed.number, 101);
  assert.strictEqual(parsed.subpage, 2);
  assert.strictEqual(parsed.subpageCount, 3);
});

test('renderJSON cells array has correct dimensions', () => {
  const page = createPage(100);
  const json = renderJSON(page);
  const parsed = JSON.parse(json);
  
  assert.strictEqual(parsed.cells.length, 24);
  for (const row of parsed.cells) {
    assert.strictEqual(row.length, 40);
  }
});

test('renderJSON preserves cell data', () => {
  const page = createPage(100);
  page.cells[5][10].ch = 'X';
  page.cells[5][10].fg = COLOURS.CYAN;
  page.cells[5][10].bg = COLOURS.MAGENTA;
  
  const json = renderJSON(page);
  const parsed = JSON.parse(json);
  
  assert.strictEqual(parsed.cells[5][10].ch, 'X');
  assert.strictEqual(parsed.cells[5][10].fg, COLOURS.CYAN);
  assert.strictEqual(parsed.cells[5][10].bg, COLOURS.MAGENTA);
});
