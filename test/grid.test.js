import { test } from 'node:test';
import assert from 'node:assert';
import {
  createPage,
  transliterate,
  wordWrap,
  writeText,
  setHeader,
  setFastext,
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
  setHeader(page, 'Ghostext', 100, 'Sun 1 Nov');
  
  // Check service name
  const serviceName = [];
  for (let i = 0; i < 8; i++) {
    serviceName.push(page.cells[0][i].ch);
  }
  assert.strictEqual(serviceName.join(''), 'Ghostext');
  
  // Check time is written
  const timeStart = 40 - 'Sun 1 Nov'.length;
  const time = [];
  for (let i = timeStart; i < 40; i++) {
    if (page.cells[0][i].ch !== ' ') {
      time.push(page.cells[0][i].ch);
    }
  }
  assert.ok(time.length > 0);
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
