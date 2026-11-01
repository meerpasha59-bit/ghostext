---
inclusion: always
---
# Ghostext — product steering

Ghostext resurrects **Teletext / Ceefax** (BBC, 1974–2012): a broadcast text service of numbered
40×24-character pages, navigated by typing a 3-digit page number, with four coloured "Fastext" keys.

Kiroween 2026 entry, category **Resurrection**: bring dead tech back to life with today's innovations.

## Who it is for
- People on slow / expensive mobile data who want a calm, ad-free news digest (a page is < 1 KB).
- Terminal people: `curl ghostext.example/100` or a raw TCP (telnet-style) session shows the same pages in ANSI colour.
- Nostalgia and accessibility: high-contrast, large-glyph, keyboard-only navigation.

## Product rules
- Every page is exactly 40 columns × 24 rows. Row 0 is the header (service name, page number, date/time clock).
  Row 23 is the Fastext row (red / green / yellow / cyan links).
- Only the 8 teletext colours: black, red, green, yellow, blue, magenta, cyan, white. Support double-height and flashing.
- Page numbers 100–899. 100 = index. Sub-pages rotate (e.g. 101 1/3).
- Content is generated live from public, key-less sources (RSS feeds, Open-Meteo weather, Hacker News API), cached.
- The spooky layer is tasteful: page 666 "The Haunted Index", a ghost cursor, and "dead pages" (404 → page 404 "This page has passed over").
- Never require an account, API key, or payment to view pages.
