# Ghostext Core — Requirements

## Epic: Teletext Service Resurrection

Resurrect the BBC Teletext / Ceefax broadcast text service as a modern web service with terminal access, delivering news, weather, tech stories, and a haunted twist in nostalgic 40×24 character pages.

---

## User Stories

### US-1: Text-Mode Page Display
**As a** user on a slow connection  
**I want** to view pages as 40×24 character grids  
**So that** I can read content quickly with minimal bandwidth

**Acceptance Criteria (EARS)**
- **WHEN** any page is rendered
  - **THE SYSTEM SHALL** output exactly 40 columns and 24 rows
  - **THE SYSTEM SHALL** use only the 8 teletext colours (black, red, green, yellow, blue, magenta, cyan, white)
  - **THE SYSTEM SHALL** include a header row (row 0) showing service name, page number, date/time
  - **THE SYSTEM SHALL** include a Fastext row (row 23) with red/green/yellow/cyan link indicators

### US-2: Web Browser Access
**As a** casual user  
**I want** to access Ghostext in my web browser  
**So that** I can navigate pages with my keyboard

**Acceptance Criteria (EARS)**
- **WHEN** I visit the root URL
  - **THE SYSTEM SHALL** serve a static HTML page with embedded CSS and JavaScript
  - **THE SYSTEM SHALL** display the page as a grid of character cells
  - **THE SYSTEM SHALL** allow me to type a 3-digit page number (100-899)
  - **THE SYSTEM SHALL** support number key navigation (1-9, 0)
  - **THE SYSTEM SHALL** support four Fastext colour keys (red, green, yellow, cyan)

### US-3: Terminal Access (curl / telnet)
**As a** terminal user  
**I want** to fetch pages via curl or raw TCP  
**So that** I can read content in my console

**Acceptance Criteria (EARS)**
- **WHEN** I curl `http://ghostext.local/100`
  - **THE SYSTEM SHALL** return the page rendered in ANSI colour codes (text/plain)
- **WHEN** I connect via TCP (telnet-style)
  - **THE SYSTEM SHALL** send the current page in ANSI colour
  - **THE SYSTEM SHALL** accept 3-digit page numbers as input
  - **THE SYSTEM SHALL** navigate to the requested page

### US-4: News Feed (BBC RSS)
**As a** reader  
**I want** to see BBC news headlines on pages 101-103  
**So that** I can stay informed

**Acceptance Criteria (EARS)**
- **WHEN** page 101, 102, or 103 is requested
  - **THE SYSTEM SHALL** fetch headlines from https://feeds.bbci.co.uk/news/rss.xml
  - **THE SYSTEM SHALL** word-wrap each headline to fit 40 columns
  - **THE SYSTEM SHALL** display up to 20 lines of headlines per page
  - **THE SYSTEM SHALL** cache the feed for 5 minutes
  - **IF** the fetch fails
    - **THE SYSTEM SHALL** serve the last cached page with a "SIGNAL LOST" banner

### US-5: Weather Report
**As a** traveller  
**I want** to see weather for Delhi, London, and New York on page 400  
**So that** I can check conditions in major cities

**Acceptance Criteria (EARS)**
- **WHEN** page 400 is requested
  - **THE SYSTEM SHALL** fetch current weather from Open-Meteo API (no key required)
  - **THE SYSTEM SHALL** display temperature, conditions, humidity for each city
  - **THE SYSTEM SHALL** fit the data within 40 columns
  - **THE SYSTEM SHALL** cache weather data for 10 minutes
  - **IF** the fetch fails
    - **THE SYSTEM SHALL** serve the last cached page with a "SIGNAL LOST" banner

### US-6: Tech News (Hacker News)
**As a** tech enthusiast  
**I want** to see Hacker News top stories on page 500  
**So that** I can follow tech trends

**Acceptance Criteria (EARS)**
- **WHEN** page 500 is requested
  - **THE SYSTEM SHALL** fetch top stories from the Hacker News API
  - **THE SYSTEM SHALL** display story titles and scores
  - **THE SYSTEM SHALL** word-wrap titles to 40 columns
  - **THE SYSTEM SHALL** cache the stories for 5 minutes
  - **IF** the fetch fails
    - **THE SYSTEM SHALL** serve the last cached page with a "SIGNAL LOST" banner

### US-7: Index Page
**As a** new visitor  
**I want** to see a directory on page 100  
**So that** I know which pages are available

**Acceptance Criteria (EARS)**
- **WHEN** page 100 is requested
  - **THE SYSTEM SHALL** list all available page numbers with descriptions
  - **THE SYSTEM SHALL** include Fastext keys for quick navigation (101=red, 400=green, 500=yellow, 666=cyan)

### US-8: The Haunted Index (666)
**As a** Kiroween participant  
**I want** to see a spooky Easter egg on page 666  
**So that** the resurrection theme is honoured

**Acceptance Criteria (EARS)**
- **WHEN** page 666 is requested
  - **THE SYSTEM SHALL** display "THE HAUNTED INDEX" as the title
  - **THE SYSTEM SHALL** show a list of "dead pages" (non-existent page numbers)
  - **THE SYSTEM SHALL** include spooky flavour text

### US-9: Dead Page (404)
**As a** user navigating to a non-existent page  
**I want** to see page 404  
**So that** I understand the page does not exist

**Acceptance Criteria (EARS)**
- **WHEN** a non-existent page is requested
  - **THE SYSTEM SHALL** serve page 404
  - **THE SYSTEM SHALL** display "This page has passed over" message
  - **THE SYSTEM SHALL** suggest returning to page 100 (index)

### US-10: Text Fitting and Transliteration
**As a** content generator  
**I want** text to be automatically fitted to the grid  
**So that** content is readable on all pages

**Acceptance Criteria (EARS)**
- **WHEN** text exceeds 40 columns
  - **THE SYSTEM SHALL** word-wrap at word boundaries
  - **IF** a word exceeds 40 columns
    - **THE SYSTEM SHALL** truncate with an ellipsis (…)
- **WHEN** text contains non-ASCII characters
  - **THE SYSTEM SHALL** transliterate to the teletext character set (ASCII + block-mosaic graphics)

### US-11: Property-Based Layout Tests
**As a** developer  
**I want** the layout engine to be fuzz-tested  
**So that** no input crashes the renderer

**Acceptance Criteria (EARS)**
- **WHEN** the test suite runs
  - **THE SYSTEM SHALL** generate 100+ random input strings (varying lengths, Unicode, control chars)
  - **FOR EACH** input
    - **THE SYSTEM SHALL** render it without throwing
    - **THE SYSTEM SHALL** produce output that is exactly 24×40 cells

---

## Non-Functional Requirements

### NFR-1: Zero Runtime Dependencies
- The service **SHALL** run with only Node.js 20+ standard library (no npm dependencies at runtime)

### NFR-2: No Build Step
- The service **SHALL** be installable and runnable with `npm start` without a build step

### NFR-3: Page Size
- Each page **SHALL** be under 1 KB when rendered as HTML or ANSI

### NFR-4: Source Availability
- The service **SHALL** only consume public, key-less APIs (no authentication required)

### NFR-5: Accessibility
- The web UI **SHALL** support keyboard-only navigation
- The web UI **SHALL** use high-contrast colours

### NFR-6: License
- All code **SHALL** be MIT-licensed
- Font assets **SHALL** use an open license (OFL or similar)
