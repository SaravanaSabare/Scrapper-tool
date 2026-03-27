import { useMemo, useState } from 'react'
import NoticeCard from '../components/items/NoticeCard.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import SearchInput from '../components/ui/SearchInput.tsx'
import type { NoticeRecord } from '../types/scraper'

interface NoticesPageProps {
  notices: NoticeRecord[]
}

export default function NoticesPage({ notices }: NoticesPageProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return notices
    const lower = query.toLowerCase()
    return notices.filter((notice) =>
      `${notice.title} ${notice.content} ${notice.notice_type} ${notice.ai?.tags?.join(' ')}`.toLowerCase().includes(lower)
    )
  }, [notices, query])

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            notices
          </h2>
          <p className="mt-1 text-sm font-medium text-(--text-primary)">
            {filtered.length > 0
              ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
              : 'No results'}
            {query && notices.length !== filtered.length && (
              <span className="ml-2 font-mono-accent text-xs text-(--text-faint)">
                filtered from {notices.length}
              </span>
            )}
          </p>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search notices, type, tags…"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="no notices found"
          description={query ? 'Try a different search term.' : 'Run a scrape to capture new notices.'}
          icon="◌"
        />
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((notice) => (
            <NoticeCard key={notice.id ?? notice.item_id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  )
}
