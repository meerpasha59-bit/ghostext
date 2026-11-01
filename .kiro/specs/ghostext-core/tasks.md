# Ghostext Core — Implementation Tasks

**Status Legend:** `[ ]` Not Started · `[~]` In Progress · `[x]` Complete

---

## Phase 1: Foundation (Grid Model & Renderers)

### Task 1: Grid Model Core [US-1, US-10]
- [ ] **1.1** Create `src/grid.js` with colour constants (BLACK=0 through WHITE=7)
- [ ] **1.2** Implement `createPage(number, subpage, subpageCount)` returning 24×40 cell grid
- [ ] **1.3** Implement `wordWrap(text, width)` with word-boundary splitting
- [ ] **1.4** Implement `transliterate(text)` mapping Unicode → ASCII (smart quotes, em-dashes, etc.)
- [ ] **1.5** Implement `writeText(page, row, col, text, fg, bg, maxWidth)` with word-wrap and transliteration
- [ ] **1.6** Implement `setHeader(page, serviceName, pageNumber, dateTime)` writing to row 0
- [ ] **1.7** Implement `setFastext(page, red, green, yellow, cyan)` writing to row 23

**Acceptance:** All functions exist, handle edge cases (empty strings, overflow), and maintain 24×40 invariant

---

### Task 2: HTML Renderer [US-1, US-2]
- [ ] **2.1** Create `src/render/html.js`
- [ ] **2.2** Implement `renderHTML(page)` returning grid as nested `<div>` and `<span>` elements
- [ ] **2.3** Apply CSS classes `fg-X` and `bg-X` for each cell's colours
- [ ] **2.4** Return complete HTML fragment (no `<html>` wrapper, just grid markup)

**Acceptance:** Valid HTML, correct colour classes, 24 rows × 40 columns

---

### Task 3: ANSI Renderer [US-1, US-3]
- [ ] **3.1** Create `src/render/ansi.js`
- [ ] **3.2** Implement `renderANSI(page)` building string with ANSI escape codes
- [ ] **3.3** Use `\x1b[3Xm` for foreground, `\x1b[4Xm` for background, `\x1b[0m` for reset
- [ ] **3.4** Optimize to minimize escape sequences (only emit when colour changes)

**Acceptance:** Output renders correctly in terminal with colour support (tested manually)

---

### Task 4: JSON Renderer [US-1, US-2]
- [ ] **4.1** Create `src/render/json.js`
- [ ] **4.2** Implement `renderJSON(page)` returning stringified JSON of page structure
- [ ] **4.3** Include `number`, `subpage`, `subpageCount`, and `cells` array

**Acceptance:** Valid JSON, parseable by standard JSON parser

---

### Task 5: Render Module Index
- [ ] **5.1** Create `src/render/index.js` exporting `renderHTML`, `renderANSI`, `renderJSON`

**Acceptance:** All renderers accessible from single import

---

## Phase 2: Data Sources & Caching

### Task 6: TTL Cache [US-4, US-5, US-6]
- [ ] **6.1** Create `src/sources/cache.js`
- [ ] **6.2** Implement `Cache` class with `get(key)` and `set(key, value, ttlSeconds)` methods
- [ ] **6.3** Handle expiration: return `null` if TTL expired, delete expired entries

**Acceptance:** Cache stores and retrieves values, respects TTL

---

### Task 7: Fetch Wrapper
- [ ] **7.1** Create `src/sources/fetch.js`
- [ ] **7.2** Implement `fetchWithTimeout(url, timeoutMs = 5000)` wrapping `fetch` with timeout
- [ ] **7.3** Throw error if timeout exceeded

**Acceptance:** Fetch resolves or rejects within timeout

---

### Task 8: RSS Source [US-4]
- [ ] **8.1** Create `src/sources/rss.js`
- [ ] **8.2** Implement `fetchRSS(url, cache, fetchFn)` fetching BBC RSS feed
- [ ] **8.3** Parse XML using regex to extract `<title>` from `<item>` elements (no XML parser dependency)
- [ ] **8.4** Cache result for 5 minutes
- [ ] **8.5** On failure, return `cache.get(url + ':last-good')` with `signalLost: true`
- [ ] **8.6** On success, also store result in `url + ':last-good'`

**Acceptance:** Returns array of headline strings, handles cache and failure fallback

---

### Task 9: Weather Source [US-5]
- [ ] **9.1** Create `src/sources/weather.js`
- [ ] **9.2** Implement `fetchWeather(lat, lon, cache, fetchFn)` fetching from Open-Meteo
- [ ] **9.3** Parse JSON response extracting `temperature_2m`, `relative_humidity_2m`, `weather_code`
- [ ] **9.4** Implement `weatherCodeToText(code)` mapping WMO codes to strings (clear, cloudy, rainy, etc.)
- [ ] **9.5** Cache result for 10 minutes
- [ ] **9.6** On failure, return last-good with `signalLost: true`

**Acceptance:** Returns `{ temp, humidity, condition }` object, handles cache and failure fallback

---

### Task 10: Hacker News Source [US-6]
- [ ] **10.1** Create `src/sources/hackernews.js`
- [ ] **10.2** Implement `fetchHackerNews(cache, fetchFn)` fetching top stories
- [ ] **10.3** Fetch top story IDs from `https://hacker-news.firebaseio.com/v0/topstories.json`
- [ ] **10.4** Fetch details for top 10 stories from `https://hacker-news.firebaseio.com/v0/item/{id}.json`
- [ ] **10.5** Cache result for 5 minutes
- [ ] **10.6** On failure, return last-good with `signalLost: true`

**Acceptance:** Returns array of `{ title, score }` objects, handles cache and failure fallback

---

## Phase 3: Page Generators

### Task 11: Page 100 — Index [US-7]
- [ ] **11.1** Create `src/pages/100-index.js`
- [ ] **11.2** Implement `generate100(ctx)` returning static index page
- [ ] **11.3** Set header: "Ghostext", page 100, current date/time
- [ ] **11.4** List available pages (100, 101, 400, 500, 666)
- [ ] **11.5** Set Fastext: red=101, green=400, yellow=500, cyan=666

**Acceptance:** Page renders with all navigation links

---

### Task 12: Pages 101-103 — BBC News [US-4]
- [ ] **12.1** Create `src/pages/1xx-news.js`
- [ ] **12.2** Implement `generate101(ctx)`, `generate102(ctx)`, `generate103(ctx)`
- [ ] **12.3** Call `fetchRSS('https://feeds.bbci.co.uk/news/rss.xml', ...)`
- [ ] **12.4** Word-wrap headlines to 37 columns (3-char indent for bullet)
- [ ] **12.5** Display headlines 1-7 on page 101, 8-14 on 102, 15-21 on 103
- [ ] **12.6** If `signalLost`, add "⚠ SIGNAL LOST" banner to row 1
- [ ] **12.7** Set Fastext: red=102/103/101 (next), green=400, yellow=500, cyan=666

**Acceptance:** Headlines display across three pages, cache works, signal-lost banner appears on failure

---

### Task 13: Page 400 — Weather [US-5]
- [ ] **13.1** Create `src/pages/4xx-weather.js`
- [ ] **13.2** Implement `generate400(ctx)`
- [ ] **13.3** Fetch weather for Delhi (28.6139, 77.2090), London (51.5074, -0.1278), New York (40.7128, -74.0060)
- [ ] **13.4** Display city name, temperature, condition, humidity
- [ ] **13.5** If `signalLost`, add banner
- [ ] **13.6** Set Fastext: red=101, green=100, yellow=500, cyan=666

**Acceptance:** Weather displays for all three cities, fallback on failure

---

### Task 14: Page 500 — Hacker News [US-6]
- [ ] **14.1** Create `src/pages/5xx-tech.js`
- [ ] **14.2** Implement `generate500(ctx)`
- [ ] **14.3** Fetch top 10 stories from Hacker News
- [ ] **14.4** Display numbered list with title and score (e.g. "1. Title here (123 points)")
- [ ] **14.5** Word-wrap titles to 37 columns
- [ ] **14.6** If `signalLost`, add banner
- [ ] **14.7** Set Fastext: red=101, green=400, yellow=100, cyan=666

**Acceptance:** Top 10 stories display, fallback on failure

---

### Task 15: Page 666 — Haunted Index [US-8]
- [ ] **15.1** Create `src/pages/666-haunted.js`
- [ ] **15.2** Implement `generate666(ctx)` returning static spooky page
- [ ] **15.3** Set header: "THE HAUNTED INDEX", page 666, current date/time
- [ ] **15.4** Use block-mosaic graphics (░, ▒, ▓, █) for borders
- [ ] **15.5** List fictional "dead pages" (e.g. 200, 314, 777)
- [ ] **15.6** Set Fastext: red=101, green=400, yellow=500, cyan=100

**Acceptance:** Spooky page renders with graphics

---

### Task 16: Page 404 — Dead Page [US-9]
- [ ] **16.1** Create `src/pages/404.js`
- [ ] **16.2** Implement `generate404(ctx)` returning error page
- [ ] **16.3** Set header: "Page Not Found", page 404, current date/time
- [ ] **16.4** Display "THIS PAGE HAS PASSED OVER" message
- [ ] **16.5** Suggest returning to page 100 or 666
- [ ] **16.6** Set Fastext: red=100, green=666, yellow=101, cyan=400

**Acceptance:** 404 page renders for any non-existent page

---

### Task 17: Page Registry [US-1]
- [ ] **17.1** Create `src/pages/index.js`
- [ ] **17.2** Import all generators (100, 101-103, 400, 500, 666, 404)
- [ ] **17.3** Create `Map` mapping page numbers to generator functions
- [ ] **17.4** Implement `getPage(number, ctx)` calling appropriate generator or 404

**Acceptance:** Registry returns correct page or 404

---

## Phase 4: Servers

### Task 18: HTTP Server [US-2, US-3]
- [ ] **18.1** Create `src/server.js`
- [ ] **18.2** Import `node:http`, `node:fs`
- [ ] **18.3** Implement route `GET /api/page/:n` returning JSON (call `renderJSON`)
- [ ] **18.4** Implement route `GET /:n` (Accept: text/plain) returning ANSI (call `renderANSI`)
- [ ] **18.5** Implement static file serving from `public/` (index.html, app.js, style.css)
- [ ] **18.6** Default route `/` serves `public/index.html`
- [ ] **18.7** Create shared `Cache` instance and `fetchWithTimeout` context
- [ ] **18.8** Listen on port 3000

**Acceptance:** HTTP server responds to all routes, serves static files

---

### Task 19: TCP Server [US-3]
- [ ] **19.1** Import `node:net` in `src/server.js`
- [ ] **19.2** Implement TCP server listening on port 2323
- [ ] **19.3** On connection, send page 100 in ANSI
- [ ] **19.4** Listen for 3-digit input from client
- [ ] **19.5** On receiving valid page number, send that page in ANSI
- [ ] **19.6** Handle disconnection gracefully

**Acceptance:** TCP server accepts telnet connections, navigates pages

---

### Task 20: Server Startup Script
- [ ] **20.1** Create `package.json` with `"start": "node src/server.js"`
- [ ] **20.2** Add `"type": "module"` for ES modules
- [ ] **20.3** Document startup in README (if needed)

**Acceptance:** `npm start` launches server

---

## Phase 5: Web Front-End

### Task 21: Static HTML [US-2]
- [ ] **21.1** Create `public/index.html`
- [ ] **21.2** Define `<div id="teletext-display">` for grid rendering
- [ ] **21.3** Link to `style.css` and `app.js` (ES module)
- [ ] **21.4** Add basic meta tags (viewport, charset, title)

**Acceptance:** HTML structure valid, links to assets

---

### Task 22: JavaScript Client [US-2]
- [ ] **22.1** Create `public/app.js`
- [ ] **22.2** Implement `fetchPage(num)` calling `/api/page/${num}`
- [ ] **22.3** Implement `renderPage(page)` building CSS grid from cells
- [ ] **22.4** Add keydown listener for digits (0-9), accumulate 3-digit buffer
- [ ] **22.5** On complete 3-digit input, call `fetchPage`
- [ ] **22.6** Add keydown listeners for Fastext keys (F1=red, F2=green, F3=yellow, F4=cyan)
- [ ] **22.7** Load page 100 on initial load

**Acceptance:** Web UI navigates pages via keyboard

---

### Task 23: CSS Styling [US-2]
- [ ] **23.1** Create `public/style.css`
- [ ] **23.2** Define CSS grid for 24 rows × 40 columns
- [ ] **23.3** Style `.cell` with monospace font, fixed width (1ch), fixed height (1.2em)
- [ ] **23.4** Define colour classes `.fg-0` through `.fg-7`, `.bg-0` through `.bg-7`
- [ ] **23.5** Set black background, white text for body
- [ ] **23.6** Center grid on screen

**Acceptance:** Page renders as authentic teletext grid

---

### Task 24: Font Integration [US-2, NFR-6]
- [ ] **24.1** Research open-licensed teletext fonts (e.g. "Mode7" font under OFL)
- [ ] **24.2** Download and include font file in `public/fonts/`
- [ ] **24.3** Update `style.css` with `@font-face` declaration
- [ ] **24.4** Fallback to `monospace` if font fails to load

**Acceptance:** Font displays correctly or falls back gracefully

---

## Phase 6: Testing

### Task 25: Unit Tests — Grid [US-10, US-11]
- [ ] **25.1** Create `test/grid.test.js`
- [ ] **25.2** Test `createPage` returns 24×40 grid
- [ ] **25.3** Test `wordWrap` with various inputs (short, long, single-word overflow)
- [ ] **25.4** Test `transliterate` with Unicode characters (smart quotes, em-dashes, emoji)
- [ ] **25.5** Test `writeText` stays within bounds, wraps correctly
- [ ] **25.6** Test `setHeader` and `setFastext` populate correct rows

**Acceptance:** All tests pass with `node --test test/grid.test.js`

---

### Task 26: Unit Tests — Renderers [US-1]
- [ ] **26.1** Create `test/render.test.js`
- [ ] **26.2** Test `renderHTML` produces valid HTML with correct structure
- [ ] **26.3** Test `renderANSI` produces correct ANSI codes
- [ ] **26.4** Test `renderJSON` produces parseable JSON

**Acceptance:** All tests pass with `node --test test/render.test.js`

---

### Task 27: Unit Tests — Cache [US-4, US-5, US-6]
- [ ] **27.1** Create `test/cache.test.js`
- [ ] **27.2** Test cache stores and retrieves values
- [ ] **27.3** Test cache respects TTL (wait for expiration, check `null`)
- [ ] **27.4** Test cache evicts expired entries

**Acceptance:** All tests pass with `node --test test/cache.test.js`

---

### Task 28: Property-Based Tests [US-11]
- [ ] **28.1** Create `test/property.test.js`
- [ ] **28.2** Implement `randomString(maxLen)` generator (random length, random Unicode)
- [ ] **28.3** Run 100+ iterations: call `writeText` with random input
- [ ] **28.4** Assert grid remains 24×40, no exceptions thrown
- [ ] **28.5** Test with edge cases: empty strings, control characters, very long strings

**Acceptance:** All tests pass, no crashes observed

---

### Task 29: Integration Test — End-to-End
- [ ] **29.1** Create `test/integration.test.js`
- [ ] **29.2** Start HTTP server programmatically
- [ ] **29.3** Fetch `/api/page/100`, assert JSON structure
- [ ] **29.4** Fetch `/100`, assert ANSI output
- [ ] **29.5** Fetch `/api/page/999`, assert 404 page returned
- [ ] **29.6** Shut down server

**Acceptance:** All endpoints respond correctly

---

## Phase 7: Documentation & Polish

### Task 30: README
- [ ] **30.1** Create `README.md` with project overview
- [ ] **30.2** Document installation: `npm install` (if deps added), `npm start`
- [ ] **30.3** Document usage: web browser, curl, telnet
- [ ] **30.4** List available pages (100, 101-103, 400, 500, 666, 404)
- [ ] **30.5** Credit sources (BBC RSS, Open-Meteo, Hacker News)
- [ ] **30.6** Add MIT license reference

**Acceptance:** README is clear and complete

---

### Task 31: License
- [ ] **31.1** Create `LICENSE` file with MIT license text
- [ ] **31.2** Add copyright notice with current year

**Acceptance:** LICENSE file exists

---

### Task 32: Manual Verification
- [ ] **32.1** Start server, visit http://localhost:3000
- [ ] **32.2** Navigate to page 100, verify index displays
- [ ] **32.3** Navigate to page 101, verify BBC news displays
- [ ] **32.4** Navigate to page 400, verify weather displays
- [ ] **32.5** Navigate to page 500, verify Hacker News displays
- [ ] **32.6** Navigate to page 666, verify haunted page displays
- [ ] **32.7** Navigate to page 999, verify 404 displays
- [ ] **32.8** Test curl: `curl http://localhost:3000/100`, verify ANSI output
- [ ] **32.9** Test telnet: `telnet localhost 2323`, verify page 100 displays, type `101`, verify navigation
- [ ] **32.10** Test Fastext keys (F1-F4) in browser

**Acceptance:** All features work as specified

---

## Dependencies

```
Task 1 → Task 2, 3, 4 (renderers need grid model)
Task 2, 3, 4 → Task 5 (render index)
Task 6 → Task 8, 9, 10 (sources need cache)
Task 7 → Task 8, 9, 10 (sources need fetch wrapper)
Task 1, 8, 9, 10 → Task 11-16 (page generators need grid + sources)
Task 11-16 → Task 17 (registry needs all generators)
Task 5, 17 → Task 18, 19 (servers need renderers + registry)
Task 18 → Task 22 (client needs API)
Task 21, 22, 23 → Task 24 (font integration)
Task 25-28 → Task 29 (integration test last)
Task 1-29 → Task 30, 31, 32 (docs and verification)
```

---

## Estimated Effort

- **Phase 1 (Foundation):** ~8 hours
- **Phase 2 (Data Sources):** ~6 hours
- **Phase 3 (Page Generators):** ~8 hours
- **Phase 4 (Servers):** ~6 hours
- **Phase 5 (Web Front-End):** ~6 hours
- **Phase 6 (Testing):** ~8 hours
- **Phase 7 (Documentation):** ~2 hours

**Total:** ~44 hours
