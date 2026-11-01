---
inclusion: always
---
# Ghostext — tech steering

- Runtime: Node.js 20+, ES modules, **zero runtime dependencies** beyond the Node standard library
  (fetch, http, net, node:test). Keep it installable with `npm start` and no build step.
- Core model: a `Page` is a 24×40 grid of cells `{ch, fg, bg, flags}`; renderers are pure functions
  `renderHTML(page)`, `renderANSI(page)`, `renderJSON(page)`. Generators are `async (ctx) => Page[]`.
- Sources: fetch with a timeout and an in-memory TTL cache; on failure serve the last good page with a
  "SIGNAL LOST" banner rather than an error.
- Text must be fitted to 40 columns: word-wrap, truncate with an ellipsis, transliterate to the teletext
  character set (ASCII plus block-mosaic graphics).
- Tests: `node --test`. Property-based tests (hand-rolled generators, no deps) for the layout engine:
  for any input string the output grid is always exactly 24×40 and never throws.
- Web front end: one static `public/index.html` + `app.js` + `style.css`, a CSS grid of cells, a bundled
  open-licensed teletext-style font or monospace fallback, number-key navigation, Fastext keys.
- License: MIT. Keep `/.kiro` committed.
