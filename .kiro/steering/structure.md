---
inclusion: always
---
# Ghostext — structure steering

```
src/
  grid.js         Page/grid model, colours, text fitting, mosaic graphics
  render/         html.js, ansi.js, json.js
  sources/        rss.js, weather.js, hackernews.js, cache.js
  pages/          index.js (registry), 100-index.js, 1xx-news.js, 4xx-weather.js, 5xx-tech.js, 666-haunted.js, 404.js
  server.js       HTTP (web + /api/page/:n + text/plain ANSI for curl) and TCP terminal server
public/           index.html, app.js, style.css
test/             *.test.js (unit + property-based)
```
- One generator per file in `src/pages/`, registered in `src/pages/index.js`.
- No file over ~250 lines; keep renderers pure and side-effect free.
