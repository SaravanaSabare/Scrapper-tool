import { useCallback, useState } from 'react'
import FeedCard from '../components/feeds/FeedCard.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import ErrorBanner from '../components/ui/ErrorBanner.tsx'
import LoadingState from '../components/ui/LoadingState.tsx'
import { useFeeds } from '../hooks/useFeeds.ts'

const INTERVAL_OPTIONS = [
  { label: '15 min',  value: 15 },
  { label: '30 min',  value: 30 },
  { label: '1 hr',    value: 60 },
  { label: '6 hr',    value: 360 },
  { label: '12 hr',   value: 720 },
  { label: '24 hr',   value: 1440 }
]

export default function FeedsPage() {
  const { feeds, loading, error, scrapingId, refresh, addFeed, toggleFeed, removeFeed, scrapeOneFeed } = useFeeds()

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [interval, setInterval] = useState(30)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null)

  const handleToggleExpand = useCallback((feedId: string) => {
    setExpandedFeedId((prev) => (prev === feedId ? null : feedId))
  }, [])

  const handleAdd = useCallback(async () => {
    const trimName = name.trim()
    const trimUrl = url.trim()
    if (!trimName || !trimUrl) {
      setAddError('Name and URL are required.')
      return
    }
    setAddError('')
    setAdding(true)
    try {
      await addFeed(trimName, trimUrl, interval)
      setName('')
      setUrl('')
      setInterval(30)
    } catch (err) {
      setAddError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }, [name, url, interval, addFeed])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd() },
    [handleAdd]
  )

  return (
    <div className="space-y-8">
      {/* ── Add Feed ── */}
      <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
        <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
          add feed
        </h2>
        <p className="mt-1 text-sm text-(--text-muted)">
          Schedule any URL to be scraped automatically on a repeating interval.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-accent text-[10px] uppercase tracking-widest text-(--text-faint)">
              name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hacker News"
              className="font-mono-accent w-44 rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs text-(--text-primary) placeholder:text-(--text-faint) transition-all duration-150 focus:border-(--accent)/60 focus:outline-none focus:ring-2 focus:ring-(--accent-glow)"
              aria-label="Feed name"
            />
          </div>

          {/* URL */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="font-mono-accent text-[10px] uppercase tracking-widest text-(--text-faint)">
              url
            </label>
            <div className="flex items-center rounded-md border border-(--border) bg-(--surface-elevated) transition-all duration-150 focus-within:border-(--accent)/60 focus-within:ring-2 focus-within:ring-(--accent-glow)">
              <span className="pl-3 font-mono-accent text-xs text-(--text-faint)" aria-hidden="true">$</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://news.ycombinator.com"
                className="font-mono-accent min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-(--text-primary) placeholder:text-(--text-faint) focus:outline-none"
                aria-label="Feed URL"
              />
            </div>
          </div>

          {/* Interval */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-accent text-[10px] uppercase tracking-widest text-(--text-faint)">
              interval
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="font-mono-accent rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs text-(--text-primary) transition-all duration-150 focus:border-(--accent)/60 focus:outline-none focus:ring-2 focus:ring-(--accent-glow)"
              aria-label="Scrape interval"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-2 rounded-md bg-(--accent) px-4 py-2 font-mono-accent text-xs font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_4px_12px_var(--accent-glow)] transition-all duration-150 hover:bg-(--accent-strong) active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            {adding ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">+</span>
            )}
            Add
          </button>
        </div>

        {addError && (
          <p className="mt-3 font-mono-accent text-xs text-(--danger)">{addError}</p>
        )}
      </section>

      {/* ── Active Feeds ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
              active feeds
            </h2>
            <p className="mt-1 text-sm font-medium text-(--text-primary)">
              {feeds.length > 0
                ? `${feeds.length} feed${feeds.length === 1 ? '' : 's'} configured`
                : 'No feeds yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="font-mono-accent text-xs text-(--text-faint) transition-colors duration-150 hover:text-(--text-muted) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) rounded"
            aria-label="Refresh feeds"
          >
            ↺ refresh
          </button>
        </div>

        {error && <ErrorBanner message={error.message} onRetry={refresh} />}

        {loading ? (
          <LoadingState label="loading feeds…" />
        ) : feeds.length === 0 ? (
          <EmptyState
            title="no feeds yet"
            description="Add a URL above and set a schedule."
            icon="◉"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {feeds.map((feed) => (
              <FeedCard
                key={feed.feed_id}
                feed={feed}
                isScraping={scrapingId === feed.feed_id}
                isExpanded={expandedFeedId === feed.feed_id}
                onToggle={toggleFeed}
                onScrapeNow={scrapeOneFeed}
                onDelete={removeFeed}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
