/**
 * Hacker News API fetcher
 */

/**
 * Fetch top Hacker News stories
 * @param {Cache} cache - Cache instance
 * @param {Function} fetchFn - Fetch function
 * @returns {Promise<Object>} { stories: Array<{title, score}>, signalLost?: boolean }
 */
export async function fetchHackerNews(cache, fetchFn) {
  const cacheKey = 'hn:top';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch top story IDs
    const topResponse = await fetchFn('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topResponse.ok) throw new Error(`HN fetch failed: ${topResponse.status}`);

    const ids = await topResponse.json();
    const top10 = ids.slice(0, 10);

    // Fetch details for each story
    const stories = [];
    for (const id of top10) {
      try {
        const storyResponse = await fetchFn(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!storyResponse.ok) continue;

        const story = await storyResponse.json();
        if (story && story.title && story.score !== undefined) {
          stories.push({
            title: story.title,
            score: story.score
          });
        }
      } catch (err) {
        // Skip this story if it fails
        continue;
      }
    }

    // Cache result and save last-good
    const result = { stories };
    cache.set(cacheKey, result, 300); // 5 minutes
    cache.set(cacheKey + ':last-good', stories, 86400); // 24 hours for last-good

    return result;
  } catch (err) {
    // Try to return last-good with signal lost flag
    const lastGood = cache.get(cacheKey + ':last-good');
    if (lastGood) {
      return { stories: lastGood, signalLost: true };
    }
    throw err;
  }
}
