/**
 * Page Registry — Maps page numbers to generator functions
 */

import { generate100 } from './100-index.js';
import { generate101, generate102, generate103 } from './1xx-news.js';
import { generate400 } from './4xx-weather.js';
import { generate500 } from './5xx-tech.js';
import { generate666 } from './666-haunted.js';
import { generate404 } from './404.js';

// Map page numbers to generator functions
const PAGES = new Map([
  [100, generate100],
  [101, generate101],
  [102, generate102],
  [103, generate103],
  [400, generate400],
  [500, generate500],
  [666, generate666],
  [404, generate404]
]);

/**
 * Get a page by number
 * @param {number} number - Page number (100-899)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Object>} Page object (or 404 if not found)
 */
export async function getPage(number, ctx) {
  const generator = PAGES.get(number) || PAGES.get(404);
  const pages = await generator(ctx);
  return pages[0]; // Return first sub-page (support for rotation later)
}

/**
 * Get all available page numbers
 * @returns {number[]} Array of page numbers
 */
export function getAvailablePages() {
  return Array.from(PAGES.keys()).filter(n => n !== 404);
}
