/**
 * TTL Cache: in-memory cache with expiration
 */

export class Cache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlSeconds - Time-to-live in seconds
   */
  set(key, value, ttlSeconds) {
    this.store.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Clear all expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        this.store.delete(key);
      }
    }
  }
}
