import StatCard from '../components/ui/StatCard.tsx'
import AnalyticsPanel from '../components/analytics/AnalyticsPanel.tsx'
import type { ScrapeStats, FeedRecord } from '../types/scraper'
import { formatDate } from '../utils/formatters'

interface DashboardPageProps {
  stats: ScrapeStats
  itemsCount: number
  noticesCount: number
  feeds: FeedRecord[]
}

const PIPELINE_STEPS = [
  { id: 'url',    label: 'URL input',   desc: 'Paste any URL',          icon: '⬡' },
  { id: 'scrape', label: 'Scrape',      desc: 'Cheerio / Puppeteer',    icon: '◎' },
  { id: 'ai',     label: 'AI analysis', desc: 'Keywords + categories',  icon: '◈' },
  { id: 'store',  label: 'Store',       desc: 'Supabase Postgres',      icon: '▣' },
  { id: 'notify', label: 'Notify',      desc: 'Slack webhook',          icon: '◆' },
]

const QUICK_LINKS = [
  { label: 'API Health',   href: '/api/health',        icon: '◎' },
  { label: 'All Items',    href: '/api/jobs',           icon: '▤' },
  { label: 'All Notices',  href: '/api/notifications',  icon: '▣' },
  { label: 'All Feeds',    href: '/api/feeds',          icon: '📡' },
  { label: 'Analytics',    href: '/api/analytics',      icon: '📊' },
]

export default function DashboardPage({ stats, itemsCount, noticesCount, feeds }: DashboardPageProps) {
  const activeFeeds = feeds.filter((f) => f.active)
  const isEmpty = itemsCount === 0 && noticesCount === 0 && feeds.length === 0

  return (
    <div className="space-y-8">
      {/* Getting-started callout — only shown on a fresh install */}
      {isEmpty && (
        <section className="rounded-lg border border-(--accent)/30 bg-(--accent-soft) p-5">
          <div className="flex items-start gap-4">
            <span className="shrink-0 font-mono-accent text-2xl text-(--accent)" aria-hidden="true">⬡</span>
            <div className="space-y-2">
              <p className="font-mono-accent text-sm font-semibold text-(--accent)">Getting started</p>
              <p className="text-sm text-(--text-muted) leading-relaxed">
                Your database is empty. There are two ways to collect data:
              </p>
              <ol className="mt-1 space-y-1 pl-4 text-sm text-(--text-muted) list-decimal">
                <li><span className="text-(--text-primary) font-medium">Quick scrape</span> — paste any URL in the bar above and click <span className="font-mono-accent text-(--accent)">Scrape</span>.</li>
                <li><span className="text-(--text-primary) font-medium">Smart Feed</span> — go to the <span className="font-mono-accent text-(--accent)">Feeds</span> tab, add a URL + interval, and it will scrape automatically.</li>
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Items"    value={itemsCount}            helper="indexed"      icon="▤" />
        <StatCard label="Total Notices"  value={noticesCount}          helper="indexed"      icon="▣" />
        <StatCard label="Active Feeds"   value={activeFeeds.length}    helper="scheduled"    icon="📡" accent />
        <StatCard label="New Items"      value={stats.newItemsSaved}   helper="last scrape"  icon="◎" />
      </div>

      {/* Feed Health */}
      {feeds.length > 0 && (
        <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
          <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            feed health
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {feeds.map((feed) => (
              <div
                key={feed.feed_id}
                className="flex items-center justify-between rounded-md border border-(--border) bg-(--surface-elevated) px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 inline-block h-2 w-2 rounded-full ${feed.active ? 'animate-pulse-dot bg-(--success)' : 'bg-(--border)'}`}
                    aria-hidden="true"
                  />
                  <span className="font-mono-accent text-xs font-semibold text-(--text-primary) truncate">
                    {feed.name}
                  </span>
                  <span className="font-mono-accent rounded border border-(--accent)/25 bg-(--accent-soft) px-1.5 py-0.5 text-[10px] text-(--accent) shrink-0">
                    {feed.interval_minutes >= 60 ? `${feed.interval_minutes / 60}hr` : `${feed.interval_minutes}m`}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {typeof feed.item_count === 'number' && (
                    <span className="font-mono-accent text-[11px] text-(--text-faint)">
                      {feed.item_count} item{feed.item_count === 1 ? '' : 's'}
                    </span>
                  )}
                  <span className="font-mono-accent text-[11px] text-(--text-faint)">
                    {feed.last_scraped ? formatDate(feed.last_scraped) : 'never'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Analytics */}
      {!isEmpty && <AnalyticsPanel />}

      {/* Pipeline step flow */}
      <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
        <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
          pipeline
        </h2>
        <div className="mt-5 flex flex-wrap items-start gap-0">
          {PIPELINE_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-4 text-center first:pl-0">
                <span className="font-mono-accent flex h-9 w-9 items-center justify-center rounded-md border border-(--accent)/30 bg-(--accent-soft) text-sm text-(--accent)">
                  {step.icon}
                </span>
                <div>
                  <p className="font-mono-accent text-xs font-semibold text-(--text-primary)">{step.label}</p>
                  <p className="font-mono-accent text-[10px] text-(--text-faint)">{step.desc}</p>
                </div>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <span className="font-mono-accent mb-5 text-sm text-(--text-faint)" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
        <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
          quick links
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border border-(--border) bg-(--surface-elevated) px-3.5 py-2.5 transition-all duration-150 hover:border-(--accent)/40 hover:bg-(--surface-hover)"
            >
              <span className="font-mono-accent text-sm text-(--accent)" aria-hidden="true">
                {link.icon}
              </span>
              <span className="font-mono-accent text-xs text-(--text-muted)">{link.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
