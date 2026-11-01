/**
 * Page 100 — Index
 */

import { createPage, setHeader, setFastext, writeText, COLOURS } from '../grid.js';

/**
 * Generate page 100 (index page)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Array>} Array with single page
 */
export async function generate100(ctx) {
  const page = createPage(100);

  // Header: "Ghostext", page number, current date/time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
  setHeader(page, 'Ghostext', 100, dateStr);

  // Content: welcome and page list
  let row = 2;

  // Title
  writeText(page, row++, 5, 'WELCOME TO GHOSTEXT', COLOURS.YELLOW, COLOURS.BLACK, 30);
  row++;
  writeText(page, row++, 2, 'Your Haunted Teletext Service', COLOURS.WHITE, COLOURS.BLACK, 37);
  row++;
  row++; // blank

  // Page list
  writeText(page, row++, 2, '100  Main Index', COLOURS.WHITE, COLOURS.BLACK, 37);
  writeText(page, row++, 2, '101  BBC News Headlines', COLOURS.WHITE, COLOURS.BLACK, 37);
  writeText(page, row++, 2, '400  World Weather', COLOURS.WHITE, COLOURS.BLACK, 37);
  writeText(page, row++, 2, '500  Hacker News', COLOURS.WHITE, COLOURS.BLACK, 37);
  writeText(page, row++, 2, '666  The Haunted Index', COLOURS.WHITE, COLOURS.BLACK, 37);
  row++;

  // Instructions
  writeText(page, row++, 2, 'Type a 3-digit page number', COLOURS.CYAN, COLOURS.BLACK, 37);
  writeText(page, row++, 2, 'to visit, or use Fastext keys', COLOURS.CYAN, COLOURS.BLACK, 37);

  // Fastext links: red=101, green=400, yellow=500, cyan=666
  setFastext(page, 101, 400, 500, 666);

  return [page];
}
