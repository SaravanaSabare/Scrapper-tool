import { memo } from 'react'
import type { FeedRecord } from '../../types/scraper'
import { formatDate } from '../../utils/formatters'

interface FeedCardProps {
  feed: FeedRecord
  isScraping: boolean
  onToggle: (feedId: string, active: boolean) => void
  onScrapeNow: (feedId: string) => void
  onDelete: (feedId: string) => void
}

const INTERVAL_LABELS: Record<number, string> = {
  15: '15 min',
  30: '30 min',
  60: '1 hr',
  360: '6 hr',
  720: '12 hr',
  1440: '24 hr'
}

function getIntervalLabel(mins: number) {
  return INTERVAL_LABELS[mins] ?? `${mins} min`
}

function StatusDot({ active, scraping }: { active: boolean; scraping: boolean }) {
  if (scraping) {
    return (
      <span
        className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-(--warning)"
        aria-label="Scraping"
      />
    )
  }
  if (active) {
    return (
      <span
        className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-(--success)"
        aria-label="Active"
      />
    )
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-(--border)"
      aria-label="Paused"
    />
  )
}

function FeedCard({ feed, isScraping, onToggle, onScrapeNow, onDelete }: FeedCardProps) {
  const truncatedUrl = feed.url.length > 50 ? feed.url.slice(0, 47) + '…' : feed.url

  return (
    <article
      className="group rounded-lg border border-(--border) bg-(--surface) transition-all duration-150 hover:border-(--accent)/40 hover:bg-(--surface-hover)"
      aria-label={`Feed: ${feed.name}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Status dot */}
        <div className="mt-1 shrink-0">
          <StatusDot active={feed.active} scraping={isScraping} />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-accent text-xs font-semibold text-(--text-primary)">
              {feed.name}
            </span>
            <span className="font-mono-accent rounded border border-(--accent)/25 bg-(--accent-soft) px-1.5 py-0.5 text-[10px] text-(--accent)">
              {getIntervalLabel(feed.interval_minutes)}
            </span>
            {typeof feed.item_count === 'number' && (
              <span className="font-mono-accent rounded border border-(--border) bg-(--surface-elevated) px-1.5 py-0.5 text-[10px] text-(--text-faint)">
                {feed.item_count} item{feed.item_count === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* URL */}
          <a
            href={feed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-accent block truncate text-[11px] text-(--text-faint) transition-colors duration-150 hover:text-(--accent)"
            title={feed.url}
          >
            {truncatedUrl}
          </a>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 font-mono-accent text-[11px] text-(--text-faint)">
            {feed.last_scraped ? (
              <span>last scraped {formatDate(feed.last_scraped)}</span>
            ) : (
              <span>never scraped</span>
            )}
            <span>·</span>
            <span>added {formatDate(feed.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Active toggle */}
          <button
            type="button"
            onClick={() => onToggle(feed.feed_id, !feed.active)}
            className={`rounded-md border px-2 py-1 font-mono-accent text-[10px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${
              feed.active
                ? 'border-(--success)/40 bg-(--success)/10 text-(--success) shadow-[0_0_8px_rgba(63,185,80,0.2)]'
                : 'border-(--border) bg-(--surface-elevated) text-(--text-faint) hover:border-(--border) hover:text-(--text-muted)'
            }`}
            aria-label={feed.active ? 'Pause feed' : 'Activate feed'}
            title={feed.active ? 'Pause' : 'Activate'}
          >
            {feed.active ? 'on' : 'off'}
          </button>

          {/* Scrape now */}
          <button
            type="button"
            onClick={() => onScrapeNow(feed.feed_id)}
            disabled={isScraping}
            className="rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 font-mono-accent text-[10px] text-(--text-faint) transition-all duration-150 hover:border-(--accent)/30 hover:text-(--accent) disabled:cursor-wait disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            aria-label="Scrape now"
            title="Scrape now"
          >
            {isScraping ? '…' : '▶'}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(feed.feed_id)}
            className="rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 font-mono-accent text-[10px] text-(--text-faint) transition-all duration-150 hover:border-(--danger)/40 hover:bg-(--danger)/8 hover:text-(--danger) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--danger)"
            aria-label="Delete feed"
            title="Delete feed"
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  )
}

export default memo(FeedCard)
