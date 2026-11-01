/**
 * ANSI Renderer: convert page to ANSI-escaped terminal output
 */

// ANSI colour codes (0-7 map to standard 8 colours)
const ANSI_COLOURS = [
  30, // BLACK
  31, // RED
  32, // GREEN
  33, // YELLOW
  34, // BLUE
  35, // MAGENTA
  36, // CYAN
  37  // WHITE
];

const ANSI_BG_COLOURS = [
  40, // BLACK
  41, // RED
  42, // GREEN
  43, // YELLOW
  44, // BLUE
  45, // MAGENTA
  46, // CYAN
  47  // WHITE
];

/**
 * Render a page as ANSI-escaped string
 * @param {Object} page - Page structure
 * @returns {string} ANSI string
 */
export function renderANSI(page) {
  let output = '';
  let lastFg = null;
  let lastBg = null;

  for (let row = 0; row < page.cells.length; row++) {
    for (let col = 0; col < page.cells[row].length; col++) {
      const cell = page.cells[row][col];

      // Emit colour codes only if they change
      if (cell.fg !== lastFg) {
        output += `\x1b[${ANSI_COLOURS[cell.fg]}m`;
        lastFg = cell.fg;
      }
      if (cell.bg !== lastBg) {
        output += `\x1b[${ANSI_BG_COLOURS[cell.bg]}m`;
        lastBg = cell.bg;
      }

      // Write the character
      output += cell.ch;
    }

    // End of row: newline (no reset needed, colour carries over)
    output += '\n';
  }

  // Final reset
  output += '\x1b[0m';

  return output;
}
