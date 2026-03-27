# Universal Web Scraper — Project Documentation

## Overview

A full-stack web scraping tool that lets you paste any URL, extract high-signal links, generate heuristic AI summaries, store results locally (Excel + JSON), and push Slack notifications. No database, no LLM API keys required.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| TypeScript | 5.4.5 | Type safety |
| Vite | 5.0 | Dev server + bundler |
| Tailwind CSS | v4.2 | Utility-first styling (PostCSS plugin) |
| Axios | 1.6 | HTTP client |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js (ESM) | — | Runtime |
| Express | 4.18 | HTTP server |
| Cheerio | 1.0 | HTML parsing / scraping |
| Puppeteer | 21.6 | Headless browser fallback |
| node-cron | 3.0 | Scheduled scraping |
| xlsx | 0.18 | Excel file storage |
| Axios | 1.6 | Outbound HTTP requests |
| dotenv | 16 | Environment config |

---

## Project Structure

```
scrapper/
├── PROJECT.md
├── README.md
├── .gitignore
├── data/                        # Runtime data (git-ignored)
│   ├── jobs.xlsx                # Scraped items store (includes feed_id column)
│   ├── notices.xlsx             # Notices store
│   ├── feeds.xlsx               # Feed source definitions
│   └── ai-insights.json        # Heuristic AI summaries
│
├── client/                      # React frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js           # Vite + /api proxy to :5000
│   ├── tsconfig.json
│   ├── postcss.config.js        # Tailwind v4 PostCSS plugin
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Root component, tab state, data hooks
│       ├── app.css              # Dark-only CSS tokens, font-mono-accent, 5 keyframe animations
│       │
│       ├── types/
│       │   └── scraper.ts       # ItemRecord (+ feed_id, source), NoticeRecord, ScrapeStats, AiInsight, FeedRecord
│       │
│       ├── hooks/
│       │   ├── useAsync.ts      # Generic async state machine (idle/pending/success/error)
│       │   ├── useItems.ts      # Fetches and refreshes items list
│       │   ├── useNotices.ts    # Fetches and refreshes notices list
│       │   ├── useScrape.ts     # Triggers scrape, normalizes stats response
│       │   └── useFeeds.ts      # useReducer-based feeds state — addFeed, toggleFeed, removeFeed, scrapeOneFeed
│       │
│       ├── services/api/
│       │   ├── client.js        # Axios instance (baseURL: /api, timeout: 20s)
│       │   ├── items.js         # fetchItems(), scrapeItems(url)
│       │   ├── notices.js       # fetchNotices(), sendTestSlackNotification()
│       │   └── feeds.ts         # fetchFeeds(), createFeed(), updateFeed(), deleteFeed(), scrapeFeedNow()
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppHeader.tsx     # Dark hero — radial gradient, grid texture, monospace identity, pipeline status badges
│       │   │   ├── AppTabs.tsx       # Underline-style tabs — now 4 tabs: dashboard/items/notices/feeds
│       │   │   ├── ActionBar.tsx     # Monospace URL input w/ focus glow, animated loading bar, Scrape + Slack buttons
│       │   │   └── PageContainer.tsx # ARIA role="tabpanel" wrapper
│       │   ├── ui/
│       │   │   ├── Button.tsx        # primary (accent+glow) / secondary (border-only) / ghost — scale(0.97) active
│       │   │   ├── EmptyState.tsx    # Minimal icon + monospace title + faint description
│       │   │   ├── ErrorBanner.tsx   # Inline danger-colored error bar with retry button
│       │   │   ├── LoadingState.tsx  # Spin indicator + monospace label
│       │   │   ├── SearchInput.tsx   # Monospace input w/ focus glow + ⌘K hint badge
│       │   │   ├── SectionHeader.tsx # Section title + subtitle
│       │   │   ├── StatCard.tsx      # Large mono number, label, helper, optional icon, optional accent variant
│       │   │   └── StatusToast.tsx   # Fixed bottom-right, slide-up spring, shrinking progress bar, success/error/info
│       │   ├── items/
│       │   │   ├── ItemCard.tsx      # Compact row — now accepts feedName? prop for source badge
│       │   │   └── NoticeCard.tsx    # Compact row: notice_type badge, title, date+snippet, collapsible AI accordion
│       │   └── feeds/
│       │       └── FeedCard.tsx      # Feed row: status dot, name, interval badge, item count, URL, last scraped; toggle/scrape-now/delete actions
│       │
│       ├── pages/
│       │   ├── DashboardPage.tsx    # 4 StatCards + Feed Health section + pipeline flow + quick links
│       │   ├── ItemsPage.tsx        # Source filter dropdown + search, item grid with feed badges
│       │   ├── NoticesPage.tsx      # Searchable notices grid
│       │   └── FeedsPage.tsx        # Add Feed form + Active Feeds list
│       │
│       └── utils/
│           └── formatters.js        # formatDate(), formatDateTime(), truncate()
│
└── server/                      # Express backend
    ├── package.json
    ├── .env                     # Local secrets (git-ignored)
    ├── .env.example             # Template
    └── src/
        ├── index.js             # App setup, route mounting, startup — now starts FeedScheduler
        │
        ├── config/
        │   └── environment.js   # config object + validateEnvironment()
        │
        ├── routes/
        │   ├── jobs.js          # /api/jobs CRUD + /scrape
        │   ├── notifications.js # /api/notifications CRUD + /test/slack
        │   └── feeds.js         # /api/feeds CRUD + /:id/scrape
        │
        ├── scrapers/
        │   ├── index.js         # ScraperService — scrapeAndSave(), fallback logic
        │   ├── generic-scraper.js  # Scrapes any URL via Cheerio
        │   ├── cheerio-scraper.js  # Default site scraper (fast)
        │   └── puppeteer-scraper.js # Headless fallback (JS-rendered sites)
        │
        ├── services/
        │   ├── scheduler.js        # node-cron — default SCRAPER_URL pipeline
        │   ├── feed-scheduler.js   # Per-feed cron tasks — scheduleFeed(), rescheduleFeed(), cancelFeed(), scrapeOneFeed(), start()
        │   ├── slack.js            # Slack Block Kit webhook notifications
        │   ├── ai.js               # Heuristic AI — keywords, category, priority, summary
        │   └── email.js            # DISABLED stub — returns { disabled: true }
        │
        ├── models/
        │   └── index.js         # Job + Notice + Feed model layer
        │
        ├── storage/
        │   ├── excel-store.js   # readSheet(), writeSheet(), ensureDir() via xlsx
        │   └── ai-insights.js   # readInsights(), upsertInsight() via JSON file
        │
        ├── utils/
        │   └── ids.js           # createItemId() — SHA-256 hash of title|link|date
        │
        ├── migrations/          # One-off data migration scripts
        └── scripts/
            └── smoke-test.js    # Basic connectivity smoke test
```

---

## Data Flow

```
User pastes URL
      │
      ▼
ActionBar → POST /api/jobs/scrape { url }
      │
      ▼
generic-scraper.js
  • Fetches HTML via Axios
  • Parses with Cheerio
  • Finds all <a> tags (≥ 3-word text, valid href)
  • Resolves relative links → absolute
  • Deduplicates by link URL
  • Caps at 50 results
      │
      ▼
models/index.js (Job.create)
  • Generates SHA-256 item_id (title|link|date)
  • Skips if item_id already exists (dedup)
  • Runs heuristic AI analysis (ai.js)
  • Writes to data/jobs.xlsx + data/ai-insights.json
      │
      ▼
Response → { newItemsSaved, itemsFound }
      │
      ▼
useItems refreshes → ItemsPage re-renders
```

**Scheduled scrape** (default scraper, runs every 30 min + on startup):
```
node-cron → ScraperService.scrapeAndSave()
  → cheerio-scraper (fast) OR puppeteer-scraper (fallback)
    — both target SCRAPER_URL (default: https://news.ycombinator.com)
  → Job.create / Notice.create
  → SlackService.sendNewItemNotification() (if SLACK_WEBHOOK_URL set)
```

---

## API Endpoints

### Jobs
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | Get all scraped items |
| `GET` | `/api/jobs/recent/:hours` | Items added in the last N hours |
| `GET` | `/api/jobs/:id` | Get single item by ID |
| `POST` | `/api/jobs/scrape` | Trigger scrape — body: `{ url?: string }` |

### Notifications
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get all notices |
| `GET` | `/api/notifications/:id` | Get single notice |
| `GET` | `/api/notifications/recent/:hours` | Notices from last N hours |
| `POST` | `/api/notifications/test/slack` | Send a test Slack message |
| `POST` | `/api/notifications/batch` | Send batch Slack notification |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns status, timestamp, environment, dataDir |

### Feeds
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/feeds` | List all feed sources (with live item counts) |
| `POST` | `/api/feeds` | Add a new feed — body: `{ name, url, interval_minutes }` |
| `PATCH` | `/api/feeds/:id` | Update a feed (toggle active, change interval) |
| `DELETE` | `/api/feeds/:id` | Remove a feed |
| `POST` | `/api/feeds/:id/scrape` | Manually trigger scrape for one feed |

---

## Storage

Everything is **file-based** — no database required.

| File | Format | Content |
|---|---|---|
| `data/jobs.xlsx` | Excel | All scraped items (one row per item, includes `feed_id`) |
| `data/notices.xlsx` | Excel | All notices (one row per notice) |
| `data/feeds.xlsx` | Excel | Feed source definitions (`feed_id, name, url, interval_minutes, last_scraped, active, created_at`) |
| `data/ai-insights.json` | JSON | AI summaries keyed by `item_id` |

**Deduplication**: Each item gets a `item_id` = `SHA-256(title|link|posted_date)`. On every scrape, `Job.findByItemId()` is called first — if the item already exists, it is skipped.

---

## AI (Heuristic, No LLM)

`services/ai.js` provides zero-cost, offline AI via keyword analysis:

| Field | Method |
|---|---|
| `summary` | First 200 chars of description + top keyword injection |
| `tags` | Top-6 TF-style keywords (generic stopwords filtered) |
| `category` | Regex pattern match → `tutorial \| release \| event \| research \| product \| announcement \| article \| resource \| offer \| alert \| other` |
| `priority` | Score based on keyword signals (urgent/critical/breaking +3, security/vulnerability +2, deadline/limited +1, etc.) |
| `action_items` | Rule-based domain-agnostic suggestions (read more, share, bookmark, etc.) |

`analyzeItem({ title, description?, content? })` — no domain-specific params required.

To upgrade to a real LLM: swap `analyzeItem()` in `services/ai.js` for an OpenAI/Anthropic call — the interface is the same.

---

## Environment Variables

Create `server/.env` from `server/.env.example`:

```bash
# Server
PORT=5000
NODE_ENV=development

# Storage (leave blank to use ../data relative to server/)
DATA_DIR=

# AI mode: "heuristic" (default, no API key needed)
AI_MODE=heuristic

# Slack (optional — notifications silently skipped if not set)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Default scrape target for scheduled runs (any public URL)
SCRAPER_URL=https://news.ycombinator.com

# Scraper schedule (minutes between automated runs)
SCRAPER_INTERVAL=30
SCRAPER_RETRY_ATTEMPTS=3
```

---

## CSS Design Tokens

Defined in `client/src/app.css` — all components reference these via Tailwind v4 `(--var)` syntax. **Dark mode only** (no light mode toggle).

| Token | Value | Usage |
|---|---|---|
| `--app-bg` | `#080c14` | Page background |
| `--surface` | `#0d1117` | Card/panel backgrounds |
| `--surface-elevated` | `#111827` | Elevated surfaces, inputs |
| `--surface-hover` | `#161d2b` | Card hover state |
| `--border` | `#1e2d3d` | Borders, dividers |
| `--border-subtle` | `#161e2e` | Subtle separators |
| `--text-primary` | `#e6edf3` | Headings, body text |
| `--text-muted` | `#7d8590` | Secondary / helper text |
| `--text-faint` | `#3d444d` | Tertiary / placeholder text |
| `--accent` | `#7c6af7` | Buttons, active states, focus rings |
| `--accent-strong` | `#6355e8` | Hover accent |
| `--accent-soft` | `rgba(124,106,247,0.12)` | Tag/badge backgrounds |
| `--accent-glow` | `rgba(124,106,247,0.25)` | Focus ring glow |
| `--success` | `#3fb950` | Low priority, success toasts |
| `--warning` | `#d29922` | Medium priority badges |
| `--danger` | `#f85149` | High priority, error states |
| `--info` | `#58a6ff` | Info toasts |
| `--shadow-soft` | inset + drop shadow | Card shadows |
| `--shadow-card` | border + drop shadow | Toast / elevated panel shadow |

**Tailwind v4 syntax**: `bg-(--var)`, `text-(--var)`, `border-(--var)`, `shadow-(--var)`, `bg-linear-to-r`.

**CSS animations defined** (use via class name):
| Class | Effect |
|---|---|
| `animate-gradient-shift` | Slow 8s background-position loop |
| `animate-slide-up` | Spring entry from bottom (toasts) |
| `animate-slide-down` | Accordion expand (AI panels) |
| `animate-progress-shrink` | Width 100%→0% (toast progress bar) |
| `animate-pulse-dot` | Opacity pulse (status badge dots) |
| `font-mono-accent` | JetBrains Mono / Cascadia Code font stack |

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```powershell
# Frontend
cd client; npm install

# Backend
cd ../server; npm install
```

### Configure environment

```powershell
cd server
copy .env.example .env
# Edit .env — set SLACK_WEBHOOK_URL if you want Slack alerts
```

### Start the backend

```powershell
cd server
npm run dev        # nodemon — auto-restarts on file changes
# OR
npm start          # plain node
```

### Start the frontend

```powershell
cd client
npm run dev        # Vite dev server on http://localhost:5173
```

### Build frontend for production

```powershell
cd client
npm run build      # outputs to client/dist/
```

### Smoke test

```powershell
cd server
npm run smoke
```

---

## Known Issues / Tech Debt

| Issue | Location | Notes |
|---|---|---|
| `pg` (PostgreSQL) in dependencies | `server/package.json` | Never used — safe to remove |
| `.jsx` / `.js` shim files | `client/src/**/*.jsx` | All just re-export their `.tsx` counterpart — can be deleted once Vite config imports are updated |
| `email.js` service | `server/src/services/email.js` | Disabled stub — safe to delete entirely |
| AI summaries not persisted across restarts | `data/ai-insights.json` | File-based, survives restarts — but if `data/` is deleted, AI insights are lost |

---

## Removed Features

| Feature | Reason |
|---|---|
| SMTP / nodemailer | Removed — caused error spam on every scheduled job; `email.js` replaced with disabled stub |
| Wikipedia-specific scraping | Pivoted to universal scraper; all Wikipedia selectors, copy, and env vars removed |
| Placement/campus domain copy | Removed — all job categories, salary fields, campus-specific text replaced with generic equivalents |
| PostgreSQL | Never wired up; Excel file storage used instead |
