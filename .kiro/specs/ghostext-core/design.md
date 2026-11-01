# Ghostext Core — Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         HTTP Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Static Files │  │ API Endpoint │  │  ANSI Endpoint   │  │
│  │ /index.html  │  │ /api/page/N  │  │  /N (text/plain) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      TCP Server (telnet)                     │
│               Accepts 3-digit input, sends ANSI              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Page Registry                           │
│          Routes page number → generator function             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Page Generators                           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ 100-index │  │ 1xx-news  │  │ 4xx-wthr  │  │ 5xx-tech│ │
│  └───────────┘  └───────────┘  └───────────┘  └─────────┘ │
│  ┌───────────┐  ┌───────────┐                              │
│  │666-haunted│  │    404    │                              │
│  └───────────┘  └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Sources                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐  │
│  │  RSS Feed │  │  Weather  │  │  Hacker News API      │  │
│  │  (BBC)    │  │(Open-Meteo)│ │  (algolia)            │  │
│  └───────────┘  └───────────┘  └───────────────────────┘  │
│               Cached with TTL + "SIGNAL LOST" fallback      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Grid Model                            │
│      Page = 24×40 array of {ch, fg, bg, flags}              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Renderers                             │
│    ┌────────┐       ┌────────┐       ┌────────┐            │
│    │  HTML  │       │  ANSI  │       │  JSON  │            │
│    └────────┘       └────────┘       └────────┘            │
│         Pure functions: renderXXX(page) → string            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Page Structure

A `Page` is the fundamental data structure:

```js
{
  number: 100,           // Page number (100-899)
  subpage: 1,            // Subpage index (1/N)
  subpageCount: 1,       // Total subpages
  cells: [               // 24 rows × 40 columns = 960 cells
    [ /* 40 cells */ ],
    [ /* 40 cells */ ],
    ...                  // 24 rows total
  ]
}
```

### Cell Structure

Each cell in the grid:

```js
{
  ch: 'A',               // Single character (ASCII or teletext graphic)
  fg: 7,                 // Foreground colour (0-7)
  bg: 0,                 // Background colour (0-7)
  flags: 0               // Bitfield: DOUBLE_HEIGHT=1, FLASH=2, GRAPHICS=4
}
```

### Colour Palette

Teletext uses 8 colours (3-bit):

```js
const COLOURS = {
  BLACK:   0,  // #000000
  RED:     1,  // #FF0000
  GREEN:   2,  // #00FF00
  YELLOW:  3,  // #FFFF00
  BLUE:    4,  // #0000FF
  MAGENTA: 5,  // #FF00FF
  CYAN:    6,  // #00FFFF
  WHITE:   7   // #FFFFFF
};
```

### Fastext Navigation

Row 23 (the last row) is reserved for Fastext links:

```
[RED: 101]  [GREEN: 400]  [YELLOW: 500]  [CYAN: 666]
```

Each link occupies 10 columns, colour-coded background.

---

## Core Modules

### `src/grid.js` — Grid Model & Text Fitting

**Responsibilities:**
- Create empty 24×40 page structure
- Write text to a region with word-wrap
- Apply colour, flags (double-height, flash)
- Transliterate Unicode → ASCII/teletext
- Truncate long words with ellipsis

**Key Functions:**
```js
export function createPage(number, subpage = 1, subpageCount = 1);
export function writeText(page, row, col, text, fg, bg, maxWidth);
export function setHeader(page, serviceName, dateTime);
export function setFastext(page, red, green, yellow, cyan);
export function wordWrap(text, width);
export function transliterate(text);
```

**Word-Wrap Algorithm:**
1. Split text on whitespace
2. Accumulate words until next word exceeds `maxWidth`
3. Emit line, continue on next row
4. If single word exceeds `maxWidth`, truncate with `…`

**Transliteration:**
- Map common Unicode → ASCII (e.g., `'` → `'`, `"` → `"`, em-dash → `-`)
- Replace unmapped characters with `?`

---

### `src/render/html.js` — HTML Renderer

**Signature:**
```js
export function renderHTML(page);
```

**Output:**
- Returns a complete HTML document (or JSON for embedding)
- Each cell is a `<span>` with inline styles for fg/bg colour
- CSS classes for double-height, flash

**Structure:**
```html
<div class="teletext-grid">
  <div class="row">
    <span class="cell fg-7 bg-0">H</span>
    <span class="cell fg-7 bg-0">e</span>
    ...
  </div>
  ...
</div>
```

---

### `src/render/ansi.js` — ANSI Renderer

**Signature:**
```js
export function renderANSI(page);
```

**Output:**
- Returns a string with ANSI escape codes
- Foreground: `\x1b[3Xm` (X = 0-7)
- Background: `\x1b[4Xm`
- Reset: `\x1b[0m`

**Example:**
```
\x1b[37m\x1b[40mGhostext      100  Sun 1 Nov 2026\x1b[0m
```

---

### `src/render/json.js` — JSON Renderer

**Signature:**
```js
export function renderJSON(page);
```

**Output:**
- Returns a JSON string of the page structure
- Used by `/api/page/:n` endpoint

**Example:**
```json
{
  "number": 100,
  "subpage": 1,
  "subpageCount": 1,
  "cells": [ ... ]
}
```

---

## Page Generators

### Generator Interface

All generators are async functions:

```js
export async function generate100(ctx) {
  const page = createPage(100);
  // ... populate page
  return [page]; // Array to support sub-pages
}
```

**Context (`ctx`):**
```js
{
  cache: Map,           // Shared cache instance
  fetch: fetchWithTimeout // Wrapped fetch with timeout
}
```

### `src/pages/index.js` — Page Registry

Maps page numbers to generator functions:

```js
const PAGES = new Map([
  [100, generate100],
  [101, generate101],
  [102, generate102],
  [103, generate103],
  [400, generate400],
  [500, generate500],
  [666, generate666],
  [404, generate404]
]);

export async function getPage(number, ctx) {
  const generator = PAGES.get(number) || PAGES.get(404);
  const pages = await generator(ctx);
  return pages[0]; // Return first sub-page (rotation handled later)
}
```

---

### `src/pages/100-index.js` — Index Page

Static page listing all available pages:

```
┌────────────────────────────────────────┐
│ Ghostext          100  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│        WELCOME TO GHOSTEXT             │
│      Your Haunted Teletext Service     │
│                                        │
│  100  Main Index                       │
│  101  BBC News Headlines  ────────┐    │
│  400  World Weather       ────────┤    │
│  500  Hacker News         ────────┤    │
│  666  The Haunted Index   ────────┘    │
│                                        │
│  Type a 3-digit page number to visit   │
│                                        │
├────────────────────────────────────────┤
│ [101]     [400]     [500]     [666]    │
└────────────────────────────────────────┘
```

---

### `src/pages/1xx-news.js` — BBC News (101-103)

Fetches RSS from https://feeds.bbci.co.uk/news/rss.xml

**Layout:**
```
┌────────────────────────────────────────┐
│ BBC News          101  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│ • Headline text wraps to multiple     │
│   lines if needed, max 37 chars wide  │
│                                        │
│ • Another headline here with more     │
│   text that demonstrates wrapping     │
│                                        │
│ ...                                    │
│                                        │
├────────────────────────────────────────┤
│ [102]     [400]     [500]     [666]    │
└────────────────────────────────────────┘
```

**Pagination:**
- Page 101: headlines 1-7
- Page 102: headlines 8-14
- Page 103: headlines 15-21

---

### `src/pages/4xx-weather.js` — Weather (400)

Fetches from Open-Meteo API:
- Delhi: lat=28.6139, lon=77.2090
- London: lat=51.5074, lon=-0.1278
- New York: lat=40.7128, lon=-74.0060

**Endpoint:**
```
https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,relative_humidity_2m,weather_code
```

**Layout:**
```
┌────────────────────────────────────────┐
│ Weather           400  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│  DELHI                                 │
│  23°C  Clear sky  Humidity: 65%       │
│                                        │
│  LONDON                                │
│  12°C  Cloudy     Humidity: 80%       │
│                                        │
│  NEW YORK                              │
│  18°C  Rainy      Humidity: 75%       │
│                                        │
├────────────────────────────────────────┤
│ [101]     [100]     [500]     [666]    │
└────────────────────────────────────────┘
```

---

### `src/pages/5xx-tech.js` — Hacker News (500)

Fetches top stories from Hacker News API:
- Top stories: https://hacker-news.firebaseio.com/v0/topstories.json
- Story details: https://hacker-news.firebaseio.com/v0/item/{id}.json

**Layout:**
```
┌────────────────────────────────────────┐
│ Hacker News       500  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│  1. Story title here wraps if needed  │
│     (123 points)                       │
│                                        │
│  2. Another story title                │
│     (456 points)                       │
│                                        │
│ ...                                    │
│                                        │
├────────────────────────────────────────┤
│ [101]     [400]     [100]     [666]    │
└────────────────────────────────────────┘
```

Display top 10 stories.

---

### `src/pages/666-haunted.js` — Haunted Index (666)

Static spooky page:

```
┌────────────────────────────────────────┐
│ THE HAUNTED INDEX 666  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│   ░  THE PAGES THAT PASSED OVER  ░    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                        │
│   These pages no longer transmit:      │
│                                        │
│   • Page 200 (lost signal 1985)        │
│   • Page 314 (corrupted data)          │
│   • Page 777 (forbidden frequency)     │
│                                        │
│   Press 404 to visit the dead...       │
│                                        │
├────────────────────────────────────────┤
│ [101]     [400]     [500]     [100]    │
└────────────────────────────────────────┘
```

Use block-mosaic graphics (░, ▒, ▓, █) for spooky borders.

---

### `src/pages/404.js` — Dead Page (404)

Shown for any non-existent page:

```
┌────────────────────────────────────────┐
│ Page Not Found    404  Sun 1 Nov 2026 │
├────────────────────────────────────────┤
│                                        │
│                                        │
│      THIS PAGE HAS PASSED OVER         │
│                                        │
│   The page you requested does not      │
│   exist in our transmission.           │
│                                        │
│   Return to the index (page 100)       │
│   or visit the Haunted Index (666)     │
│                                        │
│                                        │
│                                        │
├────────────────────────────────────────┤
│ [100]     [666]     [101]     [400]    │
└────────────────────────────────────────┘
```

---

## Data Sources & Caching

### `src/sources/cache.js` — TTL Cache

Simple in-memory cache:

```js
export class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    this.store.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000
    });
  }
}
```

---

### `src/sources/rss.js` — RSS Fetcher

Fetches BBC RSS feed:

```js
export async function fetchRSS(url, cache, fetchFn) {
  const cached = cache.get(url);
  if (cached) return cached;

  try {
    const response = await fetchFn(url);
    const xml = await response.text();
    const items = parseRSS(xml); // Simple regex-based parser
    cache.set(url, items, 300); // 5 minutes
    return items;
  } catch (err) {
    const lastGood = cache.get(url + ':last-good');
    if (lastGood) {
      return { items: lastGood, signalLost: true };
    }
    throw err;
  }
}

function parseRSS(xml) {
  // Extract <title> tags from <item> elements
  const titleRegex = /<item>[\s\S]*?<title>(.*?)<\/title>/g;
  const titles = [];
  let match;
  while ((match = titleRegex.exec(xml)) !== null) {
    titles.push(match[1]);
  }
  return titles;
}
```

---

### `src/sources/weather.js` — Weather Fetcher

Fetches from Open-Meteo:

```js
export async function fetchWeather(lat, lon, cache, fetchFn) {
  const key = `weather:${lat},${lon}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const response = await fetchFn(url);
    const data = await response.json();
    const weather = {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      condition: weatherCodeToText(data.current.weather_code)
    };
    cache.set(key, weather, 600); // 10 minutes
    return weather;
  } catch (err) {
    const lastGood = cache.get(key + ':last-good');
    if (lastGood) {
      return { ...lastGood, signalLost: true };
    }
    throw err;
  }
}

function weatherCodeToText(code) {
  // WMO weather codes: 0=clear, 1-3=partly cloudy, 45=fog, 61-65=rain, etc.
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code >= 61 && code <= 65) return 'Rainy';
  return 'Unknown';
}
```

---

### `src/sources/hackernews.js` — Hacker News Fetcher

Fetches from Hacker News API:

```js
export async function fetchHackerNews(cache, fetchFn) {
  const cached = cache.get('hn:top');
  if (cached) return cached;

  try {
    const response = await fetchFn('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await response.json();
    const top10 = ids.slice(0, 10);
    
    const stories = [];
    for (const id of top10) {
      const storyResponse = await fetchFn(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const story = await storyResponse.json();
      stories.push({ title: story.title, score: story.score });
    }
    
    cache.set('hn:top', stories, 300); // 5 minutes
    return stories;
  } catch (err) {
    const lastGood = cache.get('hn:top:last-good');
    if (lastGood) {
      return { stories: lastGood, signalLost: true };
    }
    throw err;
  }
}
```

---

## Servers

### `src/server.js` — HTTP & TCP Server

**HTTP Server:**
- Serves `public/` as static files
- `GET /api/page/:n` → JSON
- `GET /:n` (Accept: text/plain) → ANSI
- Default → `public/index.html`

**TCP Server (port 2323):**
- On connection, send page 100 in ANSI
- Read 3-digit input, send corresponding page
- Handle disconnection gracefully

**Implementation Sketch:**
```js
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { getPage } from './pages/index.js';
import { renderHTML, renderANSI, renderJSON } from './render/index.js';

const cache = new Cache();

// HTTP server
http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/page/')) {
    const num = parseInt(req.url.slice(10), 10);
    const page = await getPage(num, { cache, fetch: fetchWithTimeout });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(renderJSON(page));
  } else if (/^\d{3}$/.test(req.url.slice(1))) {
    const num = parseInt(req.url.slice(1), 10);
    const page = await getPage(num, { cache, fetch: fetchWithTimeout });
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(renderANSI(page));
  } else {
    // Serve static files
    const path = req.url === '/' ? '/index.html' : req.url;
    const file = fs.readFileSync(`./public${path}`);
    res.end(file);
  }
}).listen(3000);

// TCP server
net.createServer((socket) => {
  let buffer = '';
  socket.write(renderANSI(await getPage(100, { cache, fetch: fetchWithTimeout })));
  
  socket.on('data', async (data) => {
    buffer += data.toString();
    if (/\d{3}/.test(buffer)) {
      const num = parseInt(buffer.match(/\d{3}/)[0], 10);
      socket.write(renderANSI(await getPage(num, { cache, fetch: fetchWithTimeout })));
      buffer = '';
    }
  });
}).listen(2323);
```

---

## Web Front-End

### `public/index.html`

Single-page HTML structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ghostext</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="teletext-display"></div>
  <div id="input-help">Type a 3-digit page number or use Fastext keys</div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

---

### `public/app.js`

JavaScript client:

```js
let pageBuffer = '';

async function fetchPage(num) {
  const response = await fetch(`/api/page/${num}`);
  const page = await response.json();
  renderPage(page);
}

function renderPage(page) {
  const display = document.getElementById('teletext-display');
  display.innerHTML = '';
  
  for (const row of page.cells) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    for (const cell of row) {
      const span = document.createElement('span');
      span.className = `cell fg-${cell.fg} bg-${cell.bg}`;
      span.textContent = cell.ch;
      rowDiv.appendChild(span);
    }
    display.appendChild(rowDiv);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    pageBuffer += e.key;
    if (pageBuffer.length === 3) {
      fetchPage(parseInt(pageBuffer, 10));
      pageBuffer = '';
    }
  }
  
  // Fastext keys (example: F1=red, F2=green, F3=yellow, F4=cyan)
  if (e.key === 'F1') fetchPage(101);
  if (e.key === 'F2') fetchPage(400);
  if (e.key === 'F3') fetchPage(500);
  if (e.key === 'F4') fetchPage(666);
});

// Load index on start
fetchPage(100);
```

---

### `public/style.css`

CSS styling:

```css
body {
  background: #000;
  color: #fff;
  font-family: 'Teletext', monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
}

#teletext-display {
  display: grid;
  grid-template-rows: repeat(24, 1fr);
  gap: 0;
  border: 2px solid #fff;
}

.row {
  display: grid;
  grid-template-columns: repeat(40, 1fr);
  gap: 0;
}

.cell {
  width: 1ch;
  height: 1.2em;
  text-align: center;
  font-size: 16px;
}

/* Colour classes */
.fg-0 { color: #000; } .bg-0 { background: #000; }
.fg-1 { color: #f00; } .bg-1 { background: #f00; }
.fg-2 { color: #0f0; } .bg-2 { background: #0f0; }
.fg-3 { color: #ff0; } .bg-3 { background: #ff0; }
.fg-4 { color: #00f; } .bg-4 { background: #00f; }
.fg-5 { color: #f0f; } .bg-5 { background: #f0f; }
.fg-6 { color: #0ff; } .bg-6 { background: #0ff; }
.fg-7 { color: #fff; } .bg-7 { background: #fff; }

#input-help {
  color: #888;
  margin-top: 20px;
  font-size: 14px;
}
```

---

## Error Handling

### Fetch Failures

All data sources follow the "SIGNAL LOST" pattern:

1. **First fetch attempt:** If successful, cache the result and also store a copy in `<key>:last-good`
2. **Subsequent fetches:** If cache is fresh, return cached value
3. **Cache expired, fetch fails:** Return last-good value with `signalLost: true` flag

### Rendering Signal Lost

When `signalLost` is true, the page generator adds a banner to row 1:

```
 ⚠ SIGNAL LOST - SHOWING LAST TRANSMISSION
```

---

## Testing Strategy

### Unit Tests (`test/*.test.js`)

Use Node.js built-in test runner (`node:test`):

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { wordWrap } from '../src/grid.js';

test('wordWrap fits text to width', () => {
  const result = wordWrap('Hello world this is a test', 10);
  assert.deepStrictEqual(result, ['Hello', 'world this', 'is a test']);
});
```

**Test Coverage:**
- `grid.js`: wordWrap, transliterate, createPage, writeText
- `render/*.js`: renderHTML, renderANSI, renderJSON output format
- `sources/*.js`: cache hit/miss, TTL expiration

---

### Property-Based Tests

Hand-rolled generators for fuzzing the layout engine:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { writeText, createPage } from '../src/grid.js';

// Random string generator
function randomString(maxLen) {
  const len = Math.floor(Math.random() * maxLen);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(Math.floor(Math.random() * 0x10000));
  }
  return s;
}

test('writeText never throws and maintains grid size', () => {
  for (let i = 0; i < 100; i++) {
    const page = createPage(100);
    const text = randomString(200);
    writeText(page, 1, 0, text, 7, 0, 40);
    
    // Assert grid is still 24×40
    assert.strictEqual(page.cells.length, 24);
    for (const row of page.cells) {
      assert.strictEqual(row.length, 40);
    }
  }
});
```

---

## Open Questions & Future Enhancements

1. **Font:** Need an open-licensed teletext font or fallback to monospace
2. **Sub-pages:** Rotation not implemented in MVP (only first sub-page returned)
3. **Double-height / Flash:** Flags defined but not rendered in HTML/ANSI
4. **Mosaic graphics:** Block characters (░▒▓█) used but full teletext graphics not implemented
5. **Mobile UI:** Touch navigation for Fastext keys

---

## References

- [Teletext Wikipedia](https://en.wikipedia.org/wiki/Teletext)
- [BBC Ceefax](https://en.wikipedia.org/wiki/Ceefax)
- [Open-Meteo API](https://open-meteo.com/)
- [Hacker News API](https://github.com/HackerNews/API)
- [WMO Weather Codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
