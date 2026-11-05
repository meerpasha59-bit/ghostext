import { test } from 'node:test';
import assert from 'node:assert';
import { createPage, writeText, COLOURS } from '../src/grid.js';

/**
 * Generate a random string of random length up to maxLen
 * with random Unicode characters (including some high-range chars)
 */
function randomString(maxLen) {
  const len = Math.floor(Math.random() * (maxLen + 1));
  let result = '';
  for (let i = 0; i < len; i++) {
    // Mix ASCII, Unicode, and some control-ish chars
    const choice = Math.random();
    if (choice < 0.5) {
      // ASCII printable
      result += String.fromCharCode(32 + Math.floor(Math.random() * 95));
    } else if (choice < 0.8) {
      // Unicode letters/symbols
      result += String.fromCharCode(0x100 + Math.floor(Math.random() * 0x100));
    } else {
      // High Unicode
      result += String.fromCharCode(0x2000 + Math.floor(Math.random() * 0x100));
    }
  }
  return result;
}

test('property: writeText always leaves grid 24×40', () => {
  for (let i = 0; i < 100; i++) {
    const page = createPage(100);
    const text = randomString(200);
    const row = Math.floor(Math.random() * 24);
    const col = Math.floor(Math.random() * 40);
    const maxWidth = 1 + Math.floor(Math.random() * 39);

    // Should never throw
    writeText(page, row, col, text, COLOURS.WHITE, COLOURS.BLACK, maxWidth);

    // Grid dimensions must be invariant
    assert.strictEqual(page.cells.length, 24, `Iteration ${i}: row count should be 24`);
    for (let r = 0; r < 24; r++) {
      assert.strictEqual(
        page.cells[r].length,
        40,
        `Iteration ${i}: row ${r} should have 40 columns`
      );
    }

    // All cells should have valid structure
    for (let r = 0; r < 24; r++) {
      for (let c = 0; c < 40; c++) {
        const cell = page.cells[r][c];
        assert.ok(typeof cell === 'object', `Iteration ${i}: cell [${r}][${c}] should be an object`);
        assert.ok(typeof cell.ch === 'string', `Iteration ${i}: cell [${r}][${c}].ch should be a string`);
        assert.ok(typeof cell.fg === 'number', `Iteration ${i}: cell [${r}][${c}].fg should be a number`);
        assert.ok(typeof cell.bg === 'number', `Iteration ${i}: cell [${r}][${c}].bg should be a number`);
        assert.ok(typeof cell.flags === 'number', `Iteration ${i}: cell [${r}][${c}].flags should be a number`);
      }
    }
  }
});

test('property: writeText with empty string leaves grid 24×40', () => {
  for (let i = 0; i < 50; i++) {
    const page = createPage(100);
    const row = Math.floor(Math.random() * 24);
    const col = Math.floor(Math.random() * 40);
    const maxWidth = 1 + Math.floor(Math.random() * 39);

    writeText(page, row, col, '', COLOURS.WHITE, COLOURS.BLACK, maxWidth);

    assert.strictEqual(page.cells.length, 24);
    for (let r = 0; r < 24; r++) {
      assert.strictEqual(page.cells[r].length, 40);
    }
  }
});

test('property: writeText with very long strings never throws', () => {
  for (let i = 0; i < 50; i++) {
    const page = createPage(100);
    // Generate a very long string (could be 1000+ chars)
    const text = randomString(500);
    const row = Math.floor(Math.random() * 24);
    const col = Math.floor(Math.random() * 40);

    // Should never throw, even with extreme overflow
    assert.doesNotThrow(() => {
      writeText(page, row, col, text, COLOURS.WHITE, COLOURS.BLACK, 40);
    }, `Iteration ${i}: should not throw with long text`);

    // Grid must still be valid
    assert.strictEqual(page.cells.length, 24);
  }
});

test('property: writeText with edge-case starting positions', () => {
  const edgeCases = [
    { row: 0, col: 0 },
    { row: 23, col: 0 },
    { row: 0, col: 39 },
    { row: 23, col: 39 },
    { row: 22, col: 35 }
  ];

  for (const edge of edgeCases) {
    for (let i = 0; i < 20; i++) {
      const page = createPage(100);
      const text = randomString(100);

      writeText(page, edge.row, edge.col, text, COLOURS.WHITE, COLOURS.BLACK, 40);

      assert.strictEqual(page.cells.length, 24);
      for (let r = 0; r < 24; r++) {
        assert.strictEqual(page.cells[r].length, 40);
      }
    }
  }
});

test('property: no crashes with control characters', () => {
  for (let i = 0; i < 30; i++) {
    const page = createPage(100);
    // Mix normal text with control characters
    let text = randomString(50);
    for (let j = 0; j < 10; j++) {
      const pos = Math.floor(Math.random() * text.length);
      const char = String.fromCharCode(Math.floor(Math.random() * 32));
      text = text.slice(0, pos) + char + text.slice(pos);
    }

    assert.doesNotThrow(() => {
      writeText(page, Math.floor(Math.random() * 24), 0, text, COLOURS.WHITE, COLOURS.BLACK, 40);
    }, `Iteration ${i}: should handle control characters`);

    assert.strictEqual(page.cells.length, 24);
  }
});
