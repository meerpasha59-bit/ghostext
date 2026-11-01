/**
 * Grid Model: 24×40 teletext page structure and text fitting
 */

// Teletext colour palette (3-bit)
export const COLOURS = {
  BLACK: 0,
  RED: 1,
  GREEN: 2,
  YELLOW: 3,
  BLUE: 4,
  MAGENTA: 5,
  CYAN: 6,
  WHITE: 7
};

// Cell flags
export const FLAGS = {
  DOUBLE_HEIGHT: 1,
  FLASH: 2,
  GRAPHICS: 4
};

/**
 * Create an empty 24×40 page
 * @param {number} number - Page number (100-899)
 * @param {number} subpage - Subpage index (default 1)
 * @param {number} subpageCount - Total subpages (default 1)
 * @returns {Object} Page structure
 */
export function createPage(number, subpage = 1, subpageCount = 1) {
  const cells = [];
  for (let row = 0; row < 24; row++) {
    const rowCells = [];
    for (let col = 0; col < 40; col++) {
      rowCells.push({
        ch: ' ',
        fg: COLOURS.WHITE,
        bg: COLOURS.BLACK,
        flags: 0
      });
    }
    cells.push(rowCells);
  }

  return {
    number,
    subpage,
    subpageCount,
    cells
  };
}

/**
 * Transliterate Unicode to ASCII/teletext character set
 * @param {string} text - Input text
 * @returns {string} Transliterated text
 */
export function transliterate(text) {
  if (!text) return '';

  const map = {
    '\u2018': "'",   // left single quote
    '\u2019': "'",   // right single quote
    '\u201C': '"',   // left double quote
    '\u201D': '"',   // right double quote
    '\u2013': '-',   // en-dash
    '\u2014': '-',   // em-dash
    '\u2026': '...',  // ellipsis
    '\u00A0': ' ',   // non-breaking space
    '\u00E9': 'e',   // é
    '\u00E8': 'e',   // è
    '\u00EA': 'e',   // ê
    '\u00FC': 'u',   // ü
    '\u00F1': 'n',   // ñ
    '\u00E7': 'c',   // ç
  };

  let result = '';
  for (const ch of text) {
    result += map[ch] || ch;
  }

  // Remove control characters and unmapped Unicode
  result = result.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
  result = result.replace(/[^\x20-\x7E░▒▓█\u2500\u2502]/g, '?');

  return result;
}

/**
 * Word-wrap text to a maximum width
 * @param {string} text - Input text
 * @param {number} width - Maximum width per line
 * @returns {Array<string>} Array of wrapped lines
 */
export function wordWrap(text, width) {
  if (!text || width <= 0) return [];

  const words = transliterate(text).split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;

    // If word alone is longer than width, truncate with ellipsis
    if (word.length > width) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      lines.push(word.substring(0, Math.max(1, width - 1)) + '…');
      continue;
    }

    // Try adding word to current line
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      // Word doesn't fit, push current line and start new one
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Write text to page with word-wrap and colour
 * @param {Object} page - Page object
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {string} text - Text to write
 * @param {number} fg - Foreground colour
 * @param {number} bg - Background colour
 * @param {number} maxWidth - Maximum width before wrapping
 */
export function writeText(page, row, col, text, fg, bg, maxWidth) {
  const lines = wordWrap(text, maxWidth);
  let currentRow = row;

  for (const line of lines) {
    if (currentRow >= 24) break; // Stop if we exceed page height

    let currentCol = col;
    for (const ch of line) {
      if (currentCol >= 40) break; // Stop if we exceed row width

      page.cells[currentRow][currentCol] = {
        ch,
        fg,
        bg,
        flags: 0
      };
      currentCol++;
    }
    currentRow++;
  }
}

/**
 * Set header row (row 0)
 * @param {Object} page - Page object
 * @param {string} serviceName - Service name (e.g. "Ghostext")
 * @param {number} pageNumber - Page number
 * @param {string} dateTime - Date/time string
 */
export function setHeader(page, serviceName, pageNumber, dateTime) {
  // Clear row 0
  for (let col = 0; col < 40; col++) {
    page.cells[0][col] = {
      ch: ' ',
      fg: COLOURS.WHITE,
      bg: COLOURS.BLACK,
      flags: 0
    };
  }

  // Write service name left-aligned
  let col = 0;
  for (const ch of serviceName) {
    if (col < 15) {
      page.cells[0][col] = { ch, fg: COLOURS.WHITE, bg: COLOURS.BLACK, flags: 0 };
      col++;
    }
  }

  // Write page number center-ish (columns 15-20)
  const pageStr = String(pageNumber).padStart(3, ' ');
  for (let i = 0; i < 3 && col < 25; i++) {
    page.cells[0][col] = { ch: pageStr[i], fg: COLOURS.WHITE, bg: COLOURS.BLACK, flags: 0 };
    col++;
  }

  // Write date/time right-aligned
  col = Math.max(col, 40 - dateTime.length);
  for (const ch of dateTime) {
    if (col < 40) {
      page.cells[0][col] = { ch, fg: COLOURS.WHITE, bg: COLOURS.BLACK, flags: 0 };
      col++;
    }
  }
}

/**
 * Set Fastext row (row 23) with coloured links
 * @param {Object} page - Page object
 * @param {number|string} red - Red link (page number or label)
 * @param {number|string} green - Green link
 * @param {number|string} yellow - Yellow link
 * @param {number|string} cyan - Cyan link
 */
export function setFastext(page, red, green, yellow, cyan) {
  // Clear row 23
  for (let col = 0; col < 40; col++) {
    page.cells[23][col] = {
      ch: ' ',
      fg: COLOURS.WHITE,
      bg: COLOURS.BLACK,
      flags: 0
    };
  }

  const links = [
    { text: String(red), colour: COLOURS.RED, start: 0 },
    { text: String(green), colour: COLOURS.GREEN, start: 10 },
    { text: String(yellow), colour: COLOURS.YELLOW, start: 20 },
    { text: String(cyan), colour: COLOURS.CYAN, start: 30 }
  ];

  for (const link of links) {
    // Write background colour for 10-char section
    for (let i = 0; i < 10 && link.start + i < 40; i++) {
      page.cells[23][link.start + i].bg = link.colour;
    }

    // Write text (centre-aligned within 10-char section)
    const padding = Math.floor((10 - link.text.length) / 2);
    for (let i = 0; i < link.text.length; i++) {
      const col = link.start + padding + i;
      if (col < 40) {
        page.cells[23][col].ch = link.text[i];
        page.cells[23][col].fg = COLOURS.BLACK;
      }
    }
  }
}
