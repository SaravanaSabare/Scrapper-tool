# Universal Web Scraper — Project Documentation

> Last updated: March 28, 2026

## Overview

A full-stack web scraping platform. Paste any URL, scrape structured items, enrich them with Groq LLM analysis (with heuristic fallback), persist everything to Supabase Postgres, and view/filter/export through a polished React dashboard.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| TypeScript | 5.4 | Type safety |
| Vite | 5.0 | Dev server + production bundler |
| Tailwind CSS | v4.2 | Utility-first styling (PostCSS plugin) |
| Axios | 1.6 | HTTP client (120 s timeout) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js ESM | ≥ 18 | Runtime |
| Express | 4.18 | HTTP server |
| Helmet | 8.x | Security headers |
| express-rate-limit | 7.x | API rate limiting |
| morgan | 1.x | HTTP request logging |
| Cheerio | 1.0 | HTML parsing / scraping |
| Puppeteer | 21.6 | Headless browser fallback |
| node-cron | 3.0 | Scheduled scraping |
| pg | 8.x | Supabase Postgres client |
| groq-sdk | 1.x | Groq LLM integration |
| dotenv | 16 | Environment config |

---

## Project Structure

```
scrapper/
├── PROJECT.md
├── README.md
├── .gitignore
│
├── client/                      # React + TypeScript frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js           # Vite + /api proxy + vendor chunk splitting
│   ├── tsconfig.json
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Root — tab state, hooks, ErrorBoundary
│       ├── App.css              # CSS tokens, keyframe animations, font-mono-accent
│       │
│       ├── types/
│       │   └── scraper.ts       # ItemRecord, NoticeRecord, ScrapeStats, AiInsight, FeedRecord
│       │
│       ├── hooks/
│       │   ├── useAsync.ts      # Generic async state (idle/pending/success/error)
│       │   ├── useItems.ts      # Fetch, refresh, deleteItem
│       │   ├── useNotices.ts    # Fetch, refresh notices
│       │   ├── useScrape.ts     # Trigger scrape, normalise stats
│       │   ├── useFeeds.ts      # addFeed, toggleFeed, removeFeed, scrapeOneFeed
│       │   └── useHealth.ts     # Poll /api/health for live status badges
│       │
│       ├── services/api/
│       │   ├── client.js        # Axios instance (baseURL: /api, timeout: 120 s)
│       │   ├── items.js         # fetchItems(), scrapeItems(url), deleteItem(id)
│       │   ├── notices.js       # fetchNotices(), sendTestSlackNotification()
│       │   ├── feeds.ts         # fetchFeeds(), createFeed(), updateFeed(), deleteFeed(), scrapeFeedNow()
│       │   └── health.ts        # fetchHealth()
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppHeader.tsx     # Dark hero, radial gradient, grid texture, pipeline status
│       │   │   ├── AppTabs.tsx       # Underline tabs: dashboard / items / notices / feeds
│       │   │   ├── ActionBar.tsx     # URL input, animated loading bar, Scrape + Slack buttons
│       │   │   └── PageContainer.tsx # ARIA tabpanel wrapper
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── ErrorBanner.tsx
│       │   │   ├── ErrorBoundary.tsx # Class component — catches JS crashes, shows recoverable UI
│       │   │   ├── LoadingState.tsx
│       │   │   ├── SearchInput.tsx
│       │   │   ├── SectionHeader.tsx
│       │   │   ├── StatCard.tsx
│       │   │   └── StatusToast.tsx
│       │   ├── items/
│       │   │   ├── ItemCard.tsx      # Compact card — priority badge, AI accordion, click → drawer
│       │   │   ├── ItemDrawer.tsx    # Slide-out panel — full detail, AI insights, delete button
│       │   │   └── NoticeCard.tsx
│       │   └── feeds/
│       │       └── FeedCard.tsx
│       │
│       ├── pages/
│       │   ├── DashboardPage.tsx    # Stats + feed health
│       │   ├── ItemsPage.tsx        # Priority filter pills, sort, source filter, search, CSV export, drawer
│       │   ├── NoticesPage.tsx      # Searchable notices
│       │   └── FeedsPage.tsx        # Add / manage feeds
│       │
│       └── utils/
│           ├── formatters.ts        # formatDate(), truncate()
│           └── exportCsv.ts         # exportItemsCsv(items, filename) — browser download
│
└── server/                      # Express backend
    ├── package.json
    ├── .env                     # Local secrets (git-ignored)
    ├── .env.example             # Safe template (no secrets)
    └── src/
        ├── index.js             # App bootstrap — helmet, cors, rate-limit, morgan, routes, graceful shutdown
        │
        ├── config/
        │   ├── database.js      # pg Pool — allowExitOnIdle: false, conditional SSL
        │   └── environment.js   # config object + validateEnvironment()
        │
        ├── routes/
        │   ├── jobs.js          # GET / | GET /recent/:hours | GET /:id | POST /scrape | DELETE /:id
        │   ├── notifications.js # GET / | GET /:id | POST /test/slack | POST /batch
        │   └── feeds.js         # GET / | POST / | PATCH /:id | DELETE /:id | POST /:id/scrape
        │
        ├── scrapers/
        │   ├── index.js         # ScraperService.scrapeAndSave() + fallback logic
        │   ├── generic-scraper.js
        │   ├── cheerio-scraper.js
        │   └── puppeteer-scraper.js
        │
        ├── services/
        │   ├── scheduler.js        # node-cron — default SCRAPER_URL pipeline
        │   ├── feed-scheduler.js   # Per-feed cron — scheduleFeed, rescheduleFeed, cancelFeed, scrapeOneFeed
        │   ├── ai.js               # Groq LLM + heuristic fallback (analyzeItem async)
        │   ├── slack.js            # Slack Block Kit webhooks
        │   └── email.js            # Disabled stub
        │
        ├── models/
        │   └── index.js         # Job, Notice, Feed — full CRUD against Supabase
        │
        ├── utils/
        │   └── ids.js           # createItemId() — SHA-256(title|link|date)
        │
        └── scripts/
            └── smoke-test.js
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
generic-scraper.js (Cheerio)
  • Fetches HTML via Axios
  • Parses all <a> tags (≥ 3-word text, valid href)
  • Resolves relative links, deduplicates, caps at 50
      │
      ▼
models/index.js → Job.create()
  • SHA-256 item_id — skips if already exists (dedup)
  • INSERT INTO items (Supabase)
  • await analyzeItem() → Groq or heuristic
  • INSERT INTO ai_insights (Supabase)
      │
      ▼
Response → { newItemsSaved, itemsFound }
      │
      ▼
useItems() refreshes → ItemsPage re-renders
```

**Scheduled scraping** (every `SCRAPER_INTERVAL` minutes + on startup):
```
node-cron
  → ScraperService.scrapeAndSave()
     → cheerio-scraper (fast) OR puppeteer-scraper (fallback)
     → Job.create / Notice.create
     → SlackService.sendNewItemNotification() (if SLACK_WEBHOOK_URL set)

FeedScheduler (per-feed, independent intervals)
  → FeedScheduler.scrapeOneFeed(feed)
  → Job.create for each extracted link
```

---

## API Endpoints

### Jobs / Items
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | All scraped items (with AI insights joined) |
| `GET` | `/api/jobs/recent/:hours` | Items added in last N hours |
| `GET` | `/api/jobs/:id` | Single item by ID |
| `POST` | `/api/jobs/scrape` | Trigger scrape — body: `{ url?: string }` |
| `DELETE` | `/api/jobs/:id` | Delete item (validates existence first) |

### Notifications / Notices
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | All notices |
| `GET` | `/api/notifications/:id` | Single notice |
| `GET` | `/api/notifications/recent/:hours` | Recent notices |
| `POST` | `/api/notifications/test/slack` | Send test Slack message |
| `POST` | `/api/notifications/batch` | Batch Slack notification |

### Feeds
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/feeds` | All feeds with live item counts |
| `POST` | `/api/feeds` | Create feed — body: `{ name, url, interval_minutes }` |
| `PATCH` | `/api/feeds/:id` | Update feed (toggle active, rename, change interval) |
| `DELETE` | `/api/feeds/:id` | Delete feed + cancel its cron |
| `POST` | `/api/feeds/:id/scrape` | Manually trigger feed scrape |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status, db, ai, environment, timestamp }` |

---

## Deployment — Vercel (Live)

| Item | Value |
|---|---|
| Platform | Vercel (Hobby) |
| Live URL | https://scrapper-tool-git-main-saravanas-projects-4cd03055.vercel.app |
| Repo | github.com/SaravanaSabare/Scrapper-tool |
| Branch | `main` (auto-deploys on push) |
| Build command | `vercel-build` script in root `package.json` |
| Output directory | `client/dist` |
| Serverless entry | `api/index.js` → imports `server/src/app.js` |

### How it works on Vercel
- **Frontend**: Vite builds `client/` → `client/dist/` → served as static files
- **Backend**: `api/index.js` exports the Express app as a Vercel Serverless Function
- **Routing** (`vercel.json`):
  - `/api/*` → `api/index.js` (serverless function)
  - everything else → `index.html` (SPA client-side routing)
- **No `buildCommand` in `vercel.json`** — Vercel picks up the `vercel-build` script from root `package.json` automatically

### `vercel.json`
```json
{
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Root `package.json` scripts
```json
"vercel-build": "cd client && npm install --include=dev && npx vite build"
```
`--include=dev` is required because Vite is a devDependency and Vercel's build environment skips devDeps by default.

### Vercel Environment Variables (set in dashboard)
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.glmuhfjfoovfucjjckge:...@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `GROQ_API_KEY` | `gsk_...` (set in Vercel dashboard) |
| `NODE_ENV` | `production` |

---

## Database — Supabase (Connection Pooler)

All data is persisted in 4 tables:

| Table | Primary Key | Description |
|---|---|---|
| `items` | `item_id` (TEXT) | Scraped items + metadata |
| `notices` | `item_id` (TEXT) | Notices/announcements |
| `feeds` | `feed_id` (TEXT/UUID) | Feed source definitions |
| `ai_insights` | `item_id` (TEXT) | AI analysis results (joined on read) |

**Deduplication**: `item_id = SHA-256(title|link|posted_date)`. `Job.create()` checks existence before inserting.

### Why the Transaction Pooler (not Direct Connection)
Vercel serverless functions run on AWS Lambda which is **IPv4-only**. The Supabase direct connection hostname (`db.glmuhfjfoovfucjjckge.supabase.co`) only has an **IPv6 (AAAA)** DNS record — it does not resolve on Vercel.

The **Transaction Pooler** (`aws-1-ap-southeast-1.pooler.supabase.com:6543`) has IPv4 addresses and works on all platforms.

| Connection type | Hostname | Port | IPv4? | Use case |
|---|---|---|---|---|
| Direct | `db.glmuhfjfoovfucjjckge.supabase.co` | `5432` | ❌ IPv6 only | Local dev only |
| Session Pooler | `aws-1-ap-southeast-1.pooler.supabase.com` | `5432` | ✅ | Persistent servers |
| **Transaction Pooler** | `aws-1-ap-southeast-1.pooler.supabase.com` | **`6543`** | ✅ | **Vercel / serverless** ← current |

### `database.js` Pool Config
```js
new Pool({
  connectionString,          // from DATABASE_URL env var
  ssl: { rejectUnauthorized: false },  // always on for supabase hostnames
  max: 5,                    // stay under free-tier pool_size of 15
  idleTimeoutMillis: 20_000, // release idle clients after 20s
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,     // lets serverless functions exit cleanly
})
```

---

## AI — Groq + Heuristic Fallback

`services/ai.js` calls Groq first; falls back to keyword heuristics if no key is set or the call fails.

| Field | Groq | Heuristic |
|---|---|---|
| `summary` | LLM-generated, max 160 chars | First sentence of description |
| `tags` | LLM-extracted keywords | TF-style top-6 keywords |
| `category` | LLM classification | Regex pattern matching |
| `priority` | LLM assessment | Keyword scoring (urgent/security/breaking) |
| `action_items` | LLM suggestions | Rule-based domain-agnostic suggestions |

- **Model**: `llama-3.1-8b-instant` (Groq free tier)
- **`analyzeItem(data)`** is `async` — always returns a result (never throws)
- Set `GROQ_API_KEY=` in `.env` to disable Groq and use heuristics only

---

## Security

| Measure | Implementation |
|---|---|
| Security headers | `helmet` middleware (XSS, clickjacking, MIME sniff protection) |
| Rate limiting | 200 req/min globally; 10 req/min on `/api/jobs/scrape` |
| CORS allowlist | `localhost:5173`, `localhost:4173`, `*.vercel.app` (wildcard), `CLIENT_ORIGIN` env var |
| Input validation | `DELETE /:id` validates ID length + existence before query |
| Secret management | `.env` is gitignored; `.env.example` has no real values |
| Error messages | Stack traces hidden in `NODE_ENV=production` |
| Graceful shutdown | `SIGTERM`/`SIGINT` → close server → drain pg pool → exit |
| Crash safety | `unhandledRejection` + `uncaughtException` handlers log and shutdown cleanly |

---

## Environment Variables

`server/.env` (copy from `server/.env.example`):

```bash
# Required — Supabase Transaction Pooler (IPv4-compatible, required for Vercel)
DATABASE_URL=postgresql://postgres.glmuhfjfoovfucjjckge:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Optional — Groq AI (heuristic fallback used if blank)
GROQ_API_KEY=

# Server
PORT=5000
NODE_ENV=development          # set to "production" when deployed

# CORS — set to your deployed frontend URL in production
# CLIENT_ORIGIN=https://your-app.vercel.app

# Scraper defaults
SCRAPER_URL=https://news.ycombinator.com
SCRAPER_INTERVAL=30
SCRAPER_RETRY_ATTEMPTS=3

# Notifications (optional)
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## CSS Design Tokens

All components use Tailwind v4 `(--var)` syntax. **Dark mode only.**

| Token | Value | Usage |
|---|---|---|
| `--app-bg` | `#080c14` | Page background |
| `--surface` | `#0d1117` | Cards, panels |
| `--surface-elevated` | `#111827` | Inputs, elevated surfaces |
| `--surface-hover` | `#161d2b` | Card hover state |
| `--border` | `#1e2d3d` | Borders, dividers |
| `--text-primary` | `#e6edf3` | Headings, body |
| `--text-muted` | `#7d8590` | Secondary text |
| `--text-faint` | `#3d444d` | Placeholders, labels |
| `--accent` | `#7c6af7` | Buttons, focus rings, active states |
| `--accent-soft` | `rgba(124,106,247,0.12)` | Badge backgrounds |
| `--accent-glow` | `rgba(124,106,247,0.25)` | Focus ring glow |
| `--success` | `#3fb950` | Low priority, success |
| `--warning` | `#d29922` | Medium priority |
| `--danger` | `#f85149` | High priority, errors |

**CSS animations:**

| Class | Effect |
|---|---|
| `animate-gradient-shift` | Slow 8 s background-position loop (header) |
| `animate-slide-up` | Spring entry from bottom (toasts) |
| `animate-slide-down` | Accordion expand (AI panels) |
| `animate-slide-in-right` | Drawer entry from right edge |
| `animate-fade-in` | Backdrop fade-in (drawer overlay) |
| `animate-progress-shrink` | Width 100→0% (toast timer bar) |
| `animate-pulse-dot` | Opacity pulse (status indicator dots) |
| `font-mono-accent` | JetBrains Mono / Cascadia Code stack |

---

## Known Issues / Tech Debt

| Issue | Location | Notes |
|---|---|---|
| Duplicate `.jsx` shim files | `client/src/**/*.jsx` | Re-export their `.tsx` counterpart — safe to delete |
| `email.js` stub | `server/src/services/email.js` | Disabled — safe to delete |
| `storage/` directory | `server/src/storage/` | Legacy Excel helpers — no longer used, safe to delete |
| `migrations/` directory | `server/src/migrations/` | Run manually once to create tables; not used at runtime |
| DB tables not verified | Supabase | `items`, `notices`, `feeds`, `ai_insights` tables may need `migrations/init.js` run against live DB |
| Puppeteer vulnerabilities | `server/node_modules` | 6 high-severity in bundled Chromium — use `--force` audit fix only if acceptable |
| `xlsx` dependency | `server/package.json` | No longer used after Supabase migration — safe to remove |
| Scheduler doesn't persist | `server/src/services/scheduler.js` | node-cron runs in memory — won't survive Vercel serverless cold starts; switch to Vercel Cron Jobs for production scheduling |

---

## Deployment History

| Commit | Description |
|---|---|
| `817c5d5` | Initial Vercel deploy trigger |
| `2753432` | Fix: proper vercel.json v2 builds schema |
| `9351946` | Fix: remove legacy version/builds |
| `198c380` | Fix: rewrite vercel.json UTF-8 no-BOM |
| `76304f1` | Fix: use vercel-build script, minimal vercel.json |
| `c761432` | Fix: use npm --prefix client |
| `a8b14e2` | Fix: call vite directly via full path |
| `fed0a8f` | Fix: cd into client dir, use npx vite with --include=dev |
| `0ee9bfe` | Fix: correct case-sensitive import App.css (Linux) |
| `42b5ac1` | Fix: transaction pooler with SSL, max 5 connections |

---

> 📋 PROJECT.md last synced: March 28, 2026
