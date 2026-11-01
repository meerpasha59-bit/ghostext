/**
 * Pages 101-103 — BBC News
 */

import { createPage, setHeader, setFastext, writeText, COLOURS } from '../grid.js';
import { fetchRSS } from '../sources/rss.js';

const BBC_RSS_URL = 'https://feeds.bbci.co.uk/news/rss.xml';

/**
 * Generate news pages with pagination
 * @param {number} pageNum - Page number (101, 102, or 103)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Object>} Page object
 */
async function generateNewsPage(pageNum, ctx) {
  const page = createPage(pageNum);

  // Header with full date/time format: "Sun 01 Nov  05:58:12"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const dateTime = `${dateStr}  ${timeStr}`;
  
  setHeader(page, 'BBC News', pageNum, dateTime);

  try {
    // Fetch RSS feed
    const result = await fetchRSS(BBC_RSS_URL, ctx.cache, ctx.fetch);
    const headlines = result.items || [];
    const signalLost = result.signalLost || false;

    // Show signal lost banner if needed
    if (signalLost) {
      writeText(page, 1, 1, '⚠ SIGNAL LOST - SHOWING LAST TRANSMISSION', COLOURS.RED, COLOURS.BLACK, 38);
    }

    // Determine which headlines to show on this page
    // Page 101: headlines 0-6 (7 headlines)
    // Page 102: headlines 7-13 (7 headlines)
    // Page 103: headlines 14-20 (7 headlines)
    const pageIndex = pageNum - 101;
    const startIdx = pageIndex * 7;
    const endIdx = startIdx + 7;
    const pageHeadlines = headlines.slice(startIdx, endIdx);

    // Write headlines with bullet points and word-wrap
    let row = 3;
    for (const headline of pageHeadlines) {
      if (row >= 22) break; // Leave room for Fastext row

      // Write bullet and headline
      writeText(page, row, 1, '• ' + headline, COLOURS.WHITE, COLOURS.BLACK, 37);
      row += 2; // Spacing between headlines
    }
  } catch (err) {
    writeText(page, 2, 2, 'Error fetching news', COLOURS.RED, COLOURS.BLACK, 37);
  }

  // Fastext navigation: rotate through pages
  const nextPage = pageNum === 103 ? 101 : pageNum + 1;
  setFastext(page, nextPage, 400, 500, 666);

  return page;
}

/**
 * Generate page 101
 * @param {Object} ctx - Context
 * @returns {Promise<Array>} Array with single page
 */
export async function generate101(ctx) {
  return [await generateNewsPage(101, ctx)];
}

/**
 * Generate page 102
 * @param {Object} ctx - Context
 * @returns {Promise<Array>} Array with single page
 */
export async function generate102(ctx) {
  return [await generateNewsPage(102, ctx)];
}

/**
 * Generate page 103
 * @param {Object} ctx - Context
 * @returns {Promise<Array>} Array with single page
 */
export async function generate103(ctx) {
  return [await generateNewsPage(103, ctx)];
}
