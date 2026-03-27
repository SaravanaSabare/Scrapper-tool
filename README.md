# 🔍 Universal Scraper

A full-stack web scraping application that extracts structured items from any URL, enriches them with Groq AI analysis, stores to Supabase, and displays them in a polished React dashboard.

## ✨ Features

- **Universal scraping** — paste any URL; works with Cheerio (fast) and Puppeteer (JS-heavy sites)
- **Smart Feeds** — schedule recurring scrapes per URL at custom intervals
- **Groq AI enrichment** — automatic summary, tags, category, priority, and action items per item
- **Heuristic fallback** — works without a Groq key
- **Export CSV** — download filtered items from the UI
- **Item detail drawer** — click any card for the full detail view + delete
- **Priority filter & sort** — filter by high/medium/low, sort by newest/oldest/priority
- **Supabase Postgres** — all data persisted with deduplication

## 🚀 Quick Start

### Prerequisites
- Node 18+
- A [Supabase](https://supabase.com) project with the tables created (see below)
- (Optional) A free [Groq](https://console.groq.com) API key

### 1 — Clone & install

```bash
# server
cd server
npm install

# client
cd ../client
npm install
```

### 2 — Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env and set DATABASE_URL (and optionally GROQ_API_KEY)
```

### 3 — Create Supabase tables

Paste the SQL below into your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS items (
  item_id TEXT PRIMARY KEY,
  job_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  job_type TEXT DEFAULT '',
  feed_id TEXT,
  source TEXT,
  posted_date TIMESTAMPTZ,
  link TEXT DEFAULT '',
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
  item_id TEXT PRIMARY KEY,
  notice_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  notice_type TEXT DEFAULT '',
  posted_date TIMESTAMPTZ,
  link TEXT DEFAULT '',
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feeds (
  feed_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  interval_minutes INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  last_scraped TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  item_id TEXT PRIMARY KEY,
  item_type TEXT DEFAULT 'job',
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  priority TEXT DEFAULT 'low',
  action_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4 — Run

```bash
# Terminal 1 — server (stays on port 5000)
cd server
npm start          # production
npm run dev        # dev with auto-reload (nodemon)

# Terminal 2 — client (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173**

## 🏗️ Production Build

```bash
cd client
npm run build      # outputs to client/dist/
npm run preview    # preview the production build locally
```

Serve `client/dist/` from any static host (Vercel, Netlify, Cloudflare Pages).  
Set `CLIENT_ORIGIN` in `server/.env` to your deployed frontend URL.

## 📁 Structure

```
scrapper/
├── client/          React 18 + TypeScript + Vite + Tailwind v4
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── utils/
└── server/          Express + ESM + pg (Supabase)
    └── src/
        ├── config/
        ├── models/
        ├── routes/
        ├── scrapers/
        └── services/
```

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server + DB + AI status |
| GET | `/api/jobs` | All scraped items |
| POST | `/api/jobs/scrape` | Trigger a scrape (body: `{ url? }`) |
| DELETE | `/api/jobs/:id` | Delete an item |
| GET | `/api/feeds` | All feeds |
| POST | `/api/feeds` | Create a feed |
| PATCH | `/api/feeds/:id` | Update a feed |
| DELETE | `/api/feeds/:id` | Delete a feed |
| POST | `/api/feeds/:id/scrape` | Manually scrape a feed |

- **Scheduled Scraping**: Automatic scraping on configurable intervals
- **Dashboard**: React-based UI to view all scraped data
- **REST API**: Complete API for programmatic access

## 📋 Tech Stack

### Backend
- **Node.js + Express** - Server framework
- **Excel/JSON storage** - File-based data store (no DB)
- **Heuristic AI** - Summaries, tags, priority
- **Cheerio** - HTML parsing (default)
- **Puppeteer** - Browser automation (fallback)
- **Node-cron** - Job scheduling
- **Axios** - HTTP client

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind v4** - Styling
- **TypeScript** - Typed components

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   DATA_DIR=../data
   AI_MODE=heuristic
   WIKIPEDIA_URL=https://en.wikipedia.org
   
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   
   SCRAPER_INTERVAL=30
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`

## 📡 API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/recent/:hours` - Get recent jobs
- `POST /api/jobs/scrape` - Trigger manual scrape

### Notifications
- `GET /api/notifications` - Get all notices
- `GET /api/notifications/recent/:hours` - Get recent notices
- `POST /api/notifications/test/slack` - Send test Slack notification
- `POST /api/notifications/batch` - Send batch notification

### Health
- `GET /api/health` - Check server status

## 🔧 Configuration

### Slack Setup
1. Create a Slack Webhook: https://api.slack.com/messaging/webhooks
2. Copy the webhook URL to `SLACK_WEBHOOK_URL` in `.env`

### Storage Layout
File-based storage lives in the `data/` folder (configurable via `DATA_DIR`):

- `data/jobs.xlsx`
- `data/notices.xlsx`
- `data/ai-insights.json`

## 🎨 Dashboard

The React dashboard provides:
- 📊 Statistics overview
- 📋 Complete job listings
- 📢 Notices feed
- 🔄 Manual scrape trigger
- ⚙️ Configuration guide

## 📅 Scheduling

The scraper runs automatically based on `SCRAPER_INTERVAL` (in minutes). Default: 30 minutes

To run immediately:
```bash
curl -X POST http://localhost:5000/api/jobs/scrape
```

## 🐛 Troubleshooting

### Storage Errors
- Ensure the `data/` folder is writable
- Check `DATA_DIR` in `.env`

### Slack Notifications Not Working
- Verify webhook URL is correct
- Check webhook is active in Slack

### Scraper Finding No Items
- Verify Wikipedia URL is correct
- Check HTML selectors match current Wikipedia Main Page structure
- Adjust CSS selectors in `cheerio-scraper.js` if needed

## 📝 Project Structure

```
scrapper/
├── server/
│   ├── src/
│   │   ├── scrapers/      # Web scraping logic
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # File-backed models
│   │   ├── config/        # Configuration
│   │   ├── migrations/    # (Legacy) database migrations
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 🚢 Deployment

### Hosting Options

**Backend**: Railway, Render, Heroku, DigitalOcean
**Frontend**: Vercel, Netlify, GitHub Pages
**Storage**: Local disk, shared volume, or mounted drive

### Build for Production

Backend:
```bash
cd server
npm install
npm start
```

Frontend:
```bash
cd client
npm install
npm run build
```

## 📜 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

## ❓ FAQ

**Q: How often does it scrape?**
A: Based on `SCRAPER_INTERVAL` environment variable (default: 30 minutes)

**Q: Can I modify the scraper selectors?**
A: Yes, edit the selectors in `src/scrapers/cheerio-scraper.js` to match Wikipedia's structure

**Q: Can I add custom notification channels?**
A: Yes, create new service files in `src/services/`

**Q: Is the database required?**
A: No, data is stored locally in Excel/JSON files

---

Made with ❤️ for job seekers
