import { useMemo, useState, useCallback } from 'react'
import ItemCard from '../components/items/ItemCard.tsx'
import ItemDrawer from '../components/items/ItemDrawer.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import SearchInput from '../components/ui/SearchInput.tsx'
import { exportItemsCsv } from '../utils/exportCsv'
import type { ItemRecord, FeedRecord } from '../types/scraper'

type SortKey = 'newest' | 'oldest' | 'priority'
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

interface ItemsPageProps {
  items: ItemRecord[]
  feeds: FeedRecord[]
  onRemoveItem?: (id: string) => void
  onClearAll?: () => void
  onOpenResearch?: () => void
}

export default function ItemsPage({ items, feeds, onRemoveItem, onClearAll, onOpenResearch }: ItemsPageProps) {
  const [query, setQuery]                   = useState('')
  const [sourceFeedId, setSourceFeedId]     = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortKey, setSortKey]               = useState<SortKey>('newest')
  const [selectedItem, setSelectedItem]     = useState<ItemRecord | null>(null)

  // Build feed lookup: feed_id ? name
  const feedMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const f of feeds) m[f.feed_id] = f.name
    return m
  }, [feeds])

  const filtered = useMemo(() => {
    let result = items

    if (sourceFeedId !== 'all') {
      result = result.filter((item) => item.feed_id === sourceFeedId)
    }

    if (priorityFilter !== 'all') {
      result = result.filter((item) => (item.ai?.priority || 'low').toLowerCase() === priorityFilter)
    }

    if (query.trim()) {
      const lower = query.toLowerCase()
      result = result.filter((item) =>
        `${item.title} ${item.description} ${item.job_type} ${item.company} ${item.ai?.tags?.join(' ')} ${item.ai?.category}`
          .toLowerCase()
          .includes(lower)
      )
    }

    result = [...result].sort((a, b) => {
      if (sortKey === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (sortKey === 'priority') {
        const pa = PRIORITY_ORDER[(a.ai?.priority || 'low').toLowerCase()] ?? 2
        const pb = PRIORITY_ORDER[(b.ai?.priority || 'low').toLowerCase()] ?? 2
        return pa - pb
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    return result
  }, [items, query, sourceFeedId, priorityFilter, sortKey])

  const activeSources = useMemo(() => {
    const ids = new Set(items.map((i) => i.feed_id).filter(Boolean))
    return feeds.filter((f) => ids.has(f.feed_id))
  }, [items, feeds])

  const priorityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    for (const item of items) {
      const p = (item.ai?.priority || 'low').toLowerCase() as keyof typeof counts
      if (p in counts) counts[p]++
    }
    return counts
  }, [items])

  const handleExport = useCallback(() => {
    exportItemsCsv(filtered, `scraped-items-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [filtered])

  const handleRemove = useCallback((id: string) => {
    onRemoveItem?.(id)
    // Close drawer if the deleted item is selected
    setSelectedItem((prev) => (prev && (prev.item_id ?? (prev as any).id) === id ? null : prev))
  }, [onRemoveItem])

  return (
    <div className="space-y-5">
      {/* Session banner */}
      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-md border border-(--border) bg-(--surface-elevated) px-4 py-2.5">
          <span className="font-mono-accent text-xs text-(--text-faint)">
            ?? Session — <strong className="text-(--text-muted)">{items.length} item{items.length === 1 ? '' : 's'}</strong> loaded.
            &nbsp;Not saved. Refresh page to start over.
          </span>
          <div className="flex items-center gap-2">
            {onOpenResearch && (
              <button
                onClick={onOpenResearch}
                className="font-mono-accent rounded-md border border-(--accent)/40 bg-(--accent-soft) px-3 py-1 text-xs text-(--accent) transition hover:opacity-80"
              >
                ?? Research
              </button>
            )}
            {onClearAll && (
              <button
                onClick={onClearAll}
                className="font-mono-accent rounded-md border border-(--border) px-3 py-1 text-xs text-(--text-faint) transition hover:border-(--danger)/40 hover:text-(--danger)"
              >
                Clear session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            items
          </h2>
          <p className="mt-1 text-sm font-medium text-(--text-primary)">
            {filtered.length > 0
              ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
              : 'No results'}
            {(query || sourceFeedId !== 'all' || priorityFilter !== 'all') && items.length !== filtered.length && (
              <span className="ml-2 font-mono-accent text-xs text-(--text-faint)">
                filtered from {items.length}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter pills */}
          <div className="flex items-center gap-1 rounded-md border border-(--border) bg-(--surface-elevated) p-0.5">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => {
              const isActive = priorityFilter === p
              const count = p === 'all' ? items.length : priorityCounts[p]
              const colors = p === 'high' ? 'text-(--danger)' : p === 'medium' ? 'text-(--warning)' : p === 'low' ? 'text-(--success)' : ''
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`font-mono-accent rounded px-2 py-1 text-[10px] transition-all ${
                    isActive
                      ? 'bg-(--accent-soft) text-(--accent) font-bold'
                      : `text-(--text-faint) hover:text-(--text-muted) ${colors}`
                  }`}
                >
                  {p === 'all' ? 'All' : p}{count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="font-mono-accent rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs text-(--text-muted) focus:border-(--accent)/60 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority ?</option>
          </select>

          {/* Source filter */}
          {activeSources.length > 0 && (
            <select
              value={sourceFeedId}
              onChange={(e) => setSourceFeedId(e.target.value)}
              className="font-mono-accent rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs text-(--text-muted) focus:border-(--accent)/60 focus:outline-none"
              aria-label="Filter by source feed"
            >
              <option value="all">All Sources</option>
              {activeSources.map((f) => (
                <option key={f.feed_id} value={f.feed_id}>{f.name}</option>
              ))}
            </select>
          )}

          <SearchInput value={query} onChange={setQuery} placeholder="Search items, tags…" />

          {filtered.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-2 font-mono-accent text-xs text-(--text-muted) transition hover:border-(--accent)/40 hover:text-(--accent)"
            >
              ? Export CSV
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="no items found"
          description={
            query || sourceFeedId !== 'all' || priorityFilter !== 'all'
              ? 'Try a different filter or search term.'
              : 'Trigger a scrape to load items into this session.'
          }
          icon="?"
        />
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const id = item.item_id ?? (item as any).id
            return (
              <div key={id} className="relative group">
                <ItemCard
                  item={item}
                  feedName={item.feed_id ? feedMap[item.feed_id] : undefined}
                  onClick={() => setSelectedItem(item)}
                />
                {/* Remove button — appears on hover */}
                {onRemoveItem && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(id) }}
                    title="Remove from session"
                    className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-(--border) bg-(--surface-elevated) font-mono-accent text-[10px] text-(--text-faint) opacity-0 transition-all group-hover:opacity-100 hover:border-(--danger)/40 hover:text-(--danger)"
                  >
                    ?
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ItemDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onDelete={selectedItem ? () => handleRemove(selectedItem.item_id ?? (selectedItem as any).id) : undefined}
      />
    </div>
  )
}
