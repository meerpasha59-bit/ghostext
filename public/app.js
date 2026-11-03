/**
 * Ghostext Web Client
 * Fetches teletext pages from /api/page/:n and renders them in the DOM
 * Supports keyboard navigation, Fastext buttons, auto-refresh, sub-page rotation
 */

class GhostextClient {
  constructor() {
    this.currentPage = 100;
    this.currentSubpage = 1;
    this.pageBuffer = '';
    this.lastRefresh = 0;
    this.refreshInterval = 60000; // 60 seconds
    this.autoRefreshTimer = null;
    this.ghostCursorPos = 0;
    
    this.display = document.getElementById('teletext-display');
    this.pageDigits = document.getElementById('page-digits');
    this.clearBtn = document.getElementById('clear-btn');
    this.fastextRed = document.getElementById('fastext-red');
    this.fastextGreen = document.getElementById('fastext-green');
    this.fastextYellow = document.getElementById('fastext-yellow');
    this.fastextCyan = document.getElementById('fastext-cyan');
    
    this.setupEventListeners();
    this.initClock();
    this.loadPage(100);
  }
  
  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Keyboard input for digits
    document.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        this.addDigit(e.key);
      }
      
      // Fastext keys (F1-F4)
      if (e.key === 'F1' && this.fastextRed.dataset.page) {
        this.loadPage(parseInt(this.fastextRed.dataset.page, 10));
      }
      if (e.key === 'F2' && this.fastextGreen.dataset.page) {
        this.loadPage(parseInt(this.fastextGreen.dataset.page, 10));
      }
      if (e.key === 'F3' && this.fastextYellow.dataset.page) {
        this.loadPage(parseInt(this.fastextYellow.dataset.page, 10));
      }
      if (e.key === 'F4' && this.fastextCyan.dataset.page) {
        this.loadPage(parseInt(this.fastextCyan.dataset.page, 10));
      }
      
      // F5 = Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        this.refreshPage();
      }
      
      // Arrow keys: left/right for prev/next page
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.loadPage(Math.max(100, this.currentPage - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.loadPage(Math.min(899, this.currentPage + 1));
      }
      
      // Backspace to clear
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.clearBuffer();
      }
    });
    
    // Numeric keypad buttons
    document.querySelectorAll('.keypad-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key) {
          this.addDigit(key);
        }
      });
    });
    
    // Clear button
    this.clearBtn.addEventListener('click', () => this.clearBuffer());
    
    // Fastext buttons
    this.fastextRed.addEventListener('click', () => {
      if (this.fastextRed.dataset.page) {
        this.loadPage(parseInt(this.fastextRed.dataset.page, 10));
      }
    });
    this.fastextGreen.addEventListener('click', () => {
      if (this.fastextGreen.dataset.page) {
        this.loadPage(parseInt(this.fastextGreen.dataset.page, 10));
      }
    });
    this.fastextYellow.addEventListener('click', () => {
      if (this.fastextYellow.dataset.page) {
        this.loadPage(parseInt(this.fastextYellow.dataset.page, 10));
      }
    });
    this.fastextCyan.addEventListener('click', () => {
      if (this.fastextCyan.dataset.page) {
        this.loadPage(parseInt(this.fastextCyan.dataset.page, 10));
      }
    });
  }
  
  /**
   * Add a digit to the page number buffer
   */
  addDigit(digit) {
    if (this.pageBuffer.length < 3) {
      this.pageBuffer += digit;
      this.updatePageDisplay();
      
      // Auto-load when 3 digits are entered
      if (this.pageBuffer.length === 3) {
        const pageNum = parseInt(this.pageBuffer, 10);
        setTimeout(() => {
          this.loadPage(pageNum);
        }, 200);
      }
    }
  }
  
  /**
   * Clear the page number buffer
   */
  clearBuffer() {
    this.pageBuffer = '';
    this.updatePageDisplay();
  }
  
  /**
   * Update the page display (shows typed digits or dashes)
   */
  updatePageDisplay() {
    if (this.pageBuffer.length === 0) {
      this.pageDigits.textContent = '---';
    } else {
      this.pageDigits.textContent = this.pageBuffer.padEnd(3, '-');
    }
  }
  
  /**
   * Load and render a page
   */
  async loadPage(pageNum) {
    // Clamp to valid range (100-899), but allow fetching 404 for out-of-range
    const displayNum = pageNum;
    
    try {
      this.display.classList.add('loading');
      const response = await fetch(`/api/page/${displayNum}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const page = await response.json();
      this.currentPage = displayNum;
      this.currentSubpage = page.subpage || 1;
      
      this.renderPage(page);
      this.updateFastextButtons(page);
      this.clearBuffer();
      this.resetAutoRefresh();
      
      this.lastRefresh = Date.now();
    } catch (err) {
      console.error('Failed to load page:', err);
      this.display.classList.remove('loading');
      // Show error on display (graceful degradation)
      this.showError(`Error loading page ${displayNum}`);
    }
  }
  
  /**
   * Refresh current page
   */
  async refreshPage() {
    await this.loadPage(this.currentPage);
  }
  
  /**
   * Render page cells as DOM elements
   */
  renderPage(page) {
    this.display.innerHTML = '';
    
    if (!page.cells || page.cells.length !== 24) {
      console.error('Invalid page structure');
      return;
    }
    
    // Create a flat grid of cells using CSS Grid
    for (let rowIdx = 0; rowIdx < 24; rowIdx++) {
      const row = page.cells[rowIdx];
      if (!row || row.length !== 40) {
        console.warn(`Row ${rowIdx} has invalid length`);
        continue;
      }
      
      for (let colIdx = 0; colIdx < 40; colIdx++) {
        const cell = row[colIdx];
        const span = document.createElement('span');
        span.className = `cell fg-${cell.fg} bg-${cell.bg}`;
        span.textContent = cell.ch || ' ';
        
        // Add ghost cursor at a random position
        if (this.ghostCursorPos === rowIdx * 40 + colIdx && rowIdx > 0) {
          span.classList.add('ghost-cursor');
        }
        
        this.display.appendChild(span);
      }
    }
    
    this.display.classList.remove('loading');
    this.updatePageDisplay();
  }
  
  /**
   * Update Fastext button states and links
   * Row 23 contains Fastext info: cells 0-9 (red), 10-19 (green), 20-29 (yellow), 30-39 (cyan)
   */
  updateFastextButtons(page) {
    // Parse Fastext row (row 23) to extract page numbers
    // Fastext format: "RED     GREEN   YELLOW  CYAN"
    const fastextRow = page.cells[23] || [];
    
    // Disable all buttons by default
    this.fastextRed.disabled = true;
    this.fastextGreen.disabled = true;
    this.fastextYellow.disabled = true;
    this.fastextCyan.disabled = true;
    
    delete this.fastextRed.dataset.page;
    delete this.fastextGreen.dataset.page;
    delete this.fastextYellow.dataset.page;
    delete this.fastextCyan.dataset.page;
    
    // Extract text from Fastext row and parse page numbers
    let fastextText = '';
    for (const cell of fastextRow) {
      fastextText += cell.ch || ' ';
    }
    
    // Try to find page numbers in the Fastext row
    // Common patterns: "[101]", "101", or just numbers
    const numbers = fastextText.match(/\d{3}/g) || [];
    
    if (numbers.length >= 1) {
      const redPage = parseInt(numbers[0], 10);
      if (redPage >= 100 && redPage <= 899) {
        this.fastextRed.disabled = false;
        this.fastextRed.dataset.page = redPage;
        this.fastextRed.textContent = `RED\n${redPage}`;
      }
    }
    if (numbers.length >= 2) {
      const greenPage = parseInt(numbers[1], 10);
      if (greenPage >= 100 && greenPage <= 899) {
        this.fastextGreen.disabled = false;
        this.fastextGreen.dataset.page = greenPage;
        this.fastextGreen.textContent = `GREEN\n${greenPage}`;
      }
    }
    if (numbers.length >= 3) {
      const yellowPage = parseInt(numbers[2], 10);
      if (yellowPage >= 100 && yellowPage <= 899) {
        this.fastextYellow.disabled = false;
        this.fastextYellow.dataset.page = yellowPage;
        this.fastextYellow.textContent = `YELLOW\n${yellowPage}`;
      }
    }
    if (numbers.length >= 4) {
      const cyanPage = parseInt(numbers[3], 10);
      if (cyanPage >= 100 && cyanPage <= 899) {
        this.fastextCyan.disabled = false;
        this.fastextCyan.dataset.page = cyanPage;
        this.fastextCyan.textContent = `CYAN\n${cyanPage}`;
      }
    }
  }
  
  /**
   * Initialize live clock updating the header
   */
  initClock() {
    setInterval(() => {
      this.updateClock();
    }, 1000);
    this.updateClock();
  }
  
  /**
   * Format a date as compact Ceefax-style timestamp
   * Uses the browser's local time
   */
  formatHeaderClock(date = new Date()) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${weekday} ${day} ${month} ${hours}:${minutes}`;
  }
  
  /**
   * Update the clock in the header (row 0)
   */
  updateClock() {
    const now = new Date();
    const clockText = this.formatHeaderClock(now);
    
    // Find all cells in the header and update clock position if needed
    const cells = document.querySelectorAll('.cell');
    if (cells.length >= 40) {
      // Header is in the first 40 cells (row 0)
      // The clock should be right-aligned, so we update the last 14 characters of the header
      const clockStartIdx = 40 - clockText.length;
      for (let i = 0; i < clockText.length; i++) {
        const cellIdx = clockStartIdx + i;
        if (cellIdx >= 0 && cellIdx < 40) {
          cells[cellIdx].textContent = clockText[i];
        }
      }
    }
  }
  
  /**
   * Reset auto-refresh timer
   */
  resetAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearTimeout(this.autoRefreshTimer);
    }
    
    // Auto-refresh every 60 seconds
    this.autoRefreshTimer = setTimeout(() => {
      this.refreshPage();
    }, this.refreshInterval);
  }
  
  /**
   * Show error message on display
   */
  showError(message) {
    this.display.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.style.gridColumn = '1 / -1';
    errorDiv.style.gridRow = '12';
    errorDiv.style.color = '#ff0000';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;
    this.display.appendChild(errorDiv);
  }
}

// Initialize client when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.ghostext = new GhostextClient();
});
