/**
 * Page 666 — The Haunted Index
 */

import { createPage, setHeader, setFastext, writeText, COLOURS } from '../grid.js';

/**
 * Generate page 666 (haunted index page)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Array>} Array with single page
 */
export async function generate666(ctx) {
  const page = createPage(666);

  // Header: "THE HAUNTED INDEX", page 666
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
  setHeader(page, 'THE HAUNTED INDEX', 666, dateStr);

  // Spooky border with block graphics
  let row = 2;
  const borderLine = '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░';
  writeText(page, row++, 1, borderLine, COLOURS.RED, COLOURS.BLACK, 40);

  // Title section
  row++;
  writeText(page, row++, 3, 'THE PAGES THAT PASSED OVER', COLOURS.MAGENTA, COLOURS.BLACK, 34);

  // Border
  row++;
  writeText(page, row++, 1, borderLine, COLOURS.RED, COLOURS.BLACK, 40);

  row++;
  writeText(page, row++, 2, 'These pages no longer transmit:', COLOURS.WHITE, COLOURS.BLACK, 37);

  row++;

  // List of dead pages
  const deadPages = [
    { num: 200, desc: 'lost signal 1985' },
    { num: 314, desc: 'corrupted data' },
    { num: 777, desc: 'forbidden frequency' },
    { num: 999, desc: 'temporal anomaly' }
  ];

  for (const deadPage of deadPages) {
    if (row >= 21) break;
    writeText(page, row++, 4, `• Page ${deadPage.num} (${deadPage.desc})`, COLOURS.YELLOW, COLOURS.BLACK, 35);
  }

  row++;
  writeText(page, row++, 2, 'Press 404 to visit the dead...', COLOURS.CYAN, COLOURS.BLACK, 37);

  // Fastext links: red=101, green=400, yellow=500, cyan=100 (back to index)
  setFastext(page, 101, 400, 500, 100);

  return [page];
}
