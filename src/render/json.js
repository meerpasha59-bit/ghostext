/**
 * JSON Renderer: convert page to JSON
 */

/**
 * Render a page as JSON string
 * @param {Object} page - Page structure
 * @returns {string} JSON string
 */
export function renderJSON(page) {
  return JSON.stringify(page);
}
