/**
 * Page 404 — Dead Page (not found)
 */

import { createPage, setHeader, setFastext, writeText, formatHeaderClock, COLOURS } from '../grid.js';

/**
 * Generate page 404 (error page)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Array>} Array with single page
 */
export async function generate404(ctx) {
  const page = createPage(404);

  // Header
  setHeader(page, 'Page Not Found', 404, formatHeaderClock());

  // Content
  let row = 3;
  row++; // Spacing

  writeText(page, row++, 5, 'THIS PAGE HAS PASSED OVER', COLOURS.RED, COLOURS.BLACK, 30);

  row++;
  writeText(page, row++, 2, 'The page you requested does not', COLOURS.WHITE, COLOURS.BLACK, 37);
  writeText(page, row++, 2, 'exist in our transmission.', COLOURS.WHITE, COLOURS.BLACK, 37);

  row++;
  writeText(page, row++, 2, 'Return to the index (page 100)', COLOURS.CYAN, COLOURS.BLACK, 37);
  writeText(page, row++, 2, 'or visit the Haunted Index (666)', COLOURS.CYAN, COLOURS.BLACK, 37);

  // Fastext links: red=100 (index), green=666, yellow=101, cyan=400
  setFastext(page, 100, 666, 101, 400);

  return [page];
}
