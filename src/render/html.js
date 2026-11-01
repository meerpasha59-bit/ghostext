/**
 * HTML Renderer: convert page to HTML grid
 */

/**
 * Render a page as HTML
 * @param {Object} page - Page structure
 * @returns {string} HTML fragment
 */
export function renderHTML(page) {
  let html = '<div class="teletext-grid">\n';

  for (let row = 0; row < page.cells.length; row++) {
    html += '  <div class="row">\n';
    for (let col = 0; col < page.cells[row].length; col++) {
      const cell = page.cells[row][col];
      const classes = [`cell`, `fg-${cell.fg}`, `bg-${cell.bg}`];
      if (cell.flags & 1) classes.push('double-height');
      if (cell.flags & 2) classes.push('flash');
      html += `    <span class="${classes.join(' ')}">${escapeHTML(cell.ch)}</span>\n`;
    }
    html += '  </div>\n';
  }

  html += '</div>';
  return html;
}

/**
 * Escape HTML special characters
 * @param {string} text - Raw text
 * @returns {string} Escaped HTML
 */
function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, ch => map[ch]);
}
