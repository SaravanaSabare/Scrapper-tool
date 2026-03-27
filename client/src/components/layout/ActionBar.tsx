import { useRef, useState } from 'react'
import Button from '../ui/Button.tsx'

interface ActionBarProps {
  onScrape: (url?: string) => void
  onTestSlack: () => void
  loading?: boolean
}

export default function ActionBar({ onScrape, onTestSlack, loading = false }: ActionBarProps) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScrape = () => {
    onScrape(url.trim() || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleScrape()
  }

  return (
    <div
      className="border-b border-(--border) bg-(--surface)"
      role="region"
      aria-label="Scrape actions"
    >
      {/* Loading bar */}
      <div className="h-0.5 w-full overflow-hidden bg-transparent">
        {loading && (
          <div
            className="h-full bg-linear-to-r from-(--accent) via-(--accent-strong) to-(--accent) animate-gradient-shift"
            style={{ width: '100%', backgroundSize: '200% 100%' }}
            role="progressbar"
            aria-label="Scraping in progress"
          />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-6 py-4 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* URL input */}
          <div className="relative flex flex-1 items-center">
            <span
              className="pointer-events-none absolute left-3.5 font-mono-accent text-xs text-(--text-faint)"
              aria-hidden="true"
            >
              $
            </span>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="https://example.com"
              className={`font-mono-accent w-full rounded-md border bg-(--surface-elevated) py-2.5 pl-8 pr-4 text-sm text-(--text-primary) placeholder:text-(--text-faint) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-150 ${
                focused
                  ? 'border-(--accent) shadow-[0_0_0_3px_var(--accent-glow)]'
                  : 'border-(--border) shadow-none'
              }`}
              disabled={loading}
              aria-label="Target URL"
            />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={handleScrape}
              loading={loading}
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Scraping…' : 'Scrape'}
            </Button>
            <Button onClick={onTestSlack} variant="ghost" disabled={loading} title="Send a test message to your Slack webhook">
              Test Slack
            </Button>
          </div>
        </div>

        <p className="mt-2 font-mono-accent text-[11px] text-(--text-faint)">
          Paste a URL and click <span className="text-(--text-muted)">Scrape</span> to extract links now · leave blank to run the default pipeline · press{' '}
          <kbd className="rounded border border-(--border) bg-(--surface-elevated) px-1 py-0.5 text-[10px] text-(--text-muted)">
            ↵
          </kbd>{' '}
          to run · or use the <span className="text-(--text-muted)">Feeds</span> tab to schedule recurring scrapes
        </p>
      </div>
    </div>
  )
}
