/**
 * Fetch wrapper with timeout
 */

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000)
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If timeout exceeded or fetch fails
 */
export async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
