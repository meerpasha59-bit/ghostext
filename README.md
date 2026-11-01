# 👻 Ghostext — Teletext rises from the grave

> Kiroween 2026 entry · category **Resurrection** · built with **Kiro**

From 1974 to 2012, millions of people read the news on **Ceefax/Teletext**: numbered pages of 40×24
coloured characters, summoned by typing a three-digit number on a TV remote. Ghostext brings it back,
live, for the browser and the terminal.

- **Web**: an authentic teletext screen with number-key entry and four Fastext buttons.
- **curl**: `curl -H "User-Agent: curl/8" http://localhost:3000/100` prints the page in ANSI colour.
- **Terminal**: a raw TCP service (`nc localhost 2323`) — type a page number, get a page.
- **JSON**: `GET /api/page/:n` for anything else.

Every page is under 1 KB, ad-free and keyboard-only: calm news for slow or expensive connections.

## Page directory
| Page | Title | Source |
|---|---|---|
| 100 | Main index | — |
| 101–103 | BBC News headlines | BBC News RSS |
| 400 | World weather (Delhi, London, New York) | Open-Meteo (no key) |
| 500 | Hacker News top stories | Hacker News Firebase API |
| 666 | The Haunted Index | — |
| 404 | This page has passed over | — |

## Run it
```bash
node --version   # 20+
npm start        # HTTP on :3000, TCP terminal on :2323
npm test         # node:test, unit + property-based tests
```
Zero runtime dependencies — only the Node standard library.

## How Kiro built it
Everything in [`/.kiro`](.kiro) is committed:
- **Steering** — `product.md`, `tech.md`, `structure.md` pin the teletext rules (24×40 grid, 8 colours,
  Fastext row), zero-dependency Node and the file layout, so every Kiro session starts from the same canon.
- **Spec-driven development** — `specs/ghostext-core/` (requirements in EARS form → design → task list)
  was generated with Kiro CLI's spec mode and then executed phase by phase, ticking tasks as they landed.
- **Custom agent + hooks** — `agents/ghostext-dev.json` loads the steering and spec as resources, runs
  `git status` on spawn and the test suite after every file write.
- **IDE agent hooks** — `hooks/` re-runs tests on save, guards the 24×40 grid whenever a page generator
  changes, and keeps this page directory in sync.
- **Property-based tests** — random headlines of any length/charset must always yield an exact 24×40 grid.

A fuller write-up (CLI vs IDE, steering strategy, spec vs vibe coding) is coming before submission.

## License
[MIT](LICENSE)
