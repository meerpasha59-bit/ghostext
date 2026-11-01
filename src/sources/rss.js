/**
 * RSS Feed fetcher
 */

/**
 * Fetch BBC RSS feed
 * @param {string} url - RSS feed URL
 * @param {Cache} cache - Cache instance
 * @param {Function} fetchFn - Fetch function
 * @returns {Promise<Object>} { items: string[], signalLost?: boolean }
 */
export async function fetchRSS(url, cache, fetchFn) {
  const cacheKey = `rss:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchFn(url);
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

    const xml = await response.text();
    const items = parseRSS(xml);

    // Store result and save last-good copy
    const result = { items };
    cache.set(cacheKey, result, 300); // 5 minutes
    cache.set(cacheKey + ':last-good', items, 86400); // 24 hours for last-good

    return result;
  } catch (err) {
    // Try to return last-good with signal lost flag
    const lastGood = cache.get(cacheKey + ':last-good');
    if (lastGood) {
      return { items: lastGood, signalLost: true };
    }
    throw err;
  }
}

/**
 * Parse RSS XML with regex (no XML parser dependency)
 * @param {string} xml - XML string
 * @returns {string[]} Array of titles
 */
function parseRSS(xml) {
  const titles = [];

  // Match <item>...<title>...</title>...</item> patterns
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[0];

    // Try to match title with CDATA: <title><![CDATA[...]]></title>
    let titleMatch = /<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(itemXml);

    // Fallback to plain text title if no CDATA
    if (!titleMatch) {
      titleMatch = /<title[^>]*>([^<]*)<\/title>/.exec(itemXml);
    }

    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (title) titles.push(title);
    }
  }

  return titles;
}
