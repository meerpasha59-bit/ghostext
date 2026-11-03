/**
 * Page 500 — Hacker News
 */

import { createPage, setHeader, setFastext, writeText, formatHeaderClock, COLOURS } from '../grid.js';
import { fetchHackerNews } from '../sources/hackernews.js';

/**
 * Generate page 500 (Hacker News page)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Array>} Array with single page
 */
export async function generate500(ctx) {
  const page = createPage(500);

  // Header
  setHeader(page, 'Hacker News', 500, formatHeaderClock());

  try {
    // Fetch top stories
    const result = await fetchHackerNews(ctx.cache, ctx.fetch);
    const stories = result.stories || [];
    const signalLost = result.signalLost || false;

    // Show signal lost banner if needed
    if (signalLost) {
      writeText(page, 1, 1, '⚠ SIGNAL LOST - SHOWING LAST TRANSMISSION', COLOURS.RED, COLOURS.BLACK, 38);
    }

    // Write stories (top 10)
    let row = 3;
    for (let i = 0; i < Math.min(10, stories.length); i++) {
      if (row >= 22) break; // Leave room for Fastext row

      const story = stories[i];
      const storyNum = i + 1;
      const scoreStr = ` (${story.score} pts)`;
      const titleWithScore = `${storyNum}. ${story.title}${scoreStr}`;

      writeText(page, row, 2, titleWithScore, COLOURS.WHITE, COLOURS.BLACK, 37);
      row += 2; // Spacing between stories
    }
  } catch (err) {
    writeText(page, 2, 2, 'Error fetching stories', COLOURS.RED, COLOURS.BLACK, 37);
  }

  // Fastext links: red=101, green=400, yellow=100 (index), cyan=666
  setFastext(page, 101, 400, 100, 666);

  return [page];
}
