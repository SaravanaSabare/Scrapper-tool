import { memo, useCallback, useEffect, useState } from 'react'
import { fetchFeedItems } from '../../services/api/feeds'
import type { ItemRecord } from '../../types/scraper'
import { formatDate, truncate } from '../../utils/formatters'

interface FeedItemsPanelProps {
  feedId: string
  feedName: string
}

function FeedItemsPanel({ feedId, feedName }: FeedItemsPanelProps) {
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchFeedItems(feedId)
      setItems(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [feedId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-6">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--accent)/30 border-t-(--accent)" />
        <span className="font-mono-accent text-xs text-(--text-faint)">loading items…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-mono-accent text-xs text-(--danger)">{error}</span>
        <button
          onClick={load}
          className="font-mono-accent text-xs text-(--accent) hover:underline"
        >
          retry
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <span className="font-mono-accent text-xs text-(--text-faint)">
          No items scraped yet for {feedName}.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1 px-4 pb-4 pt-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono-accent text-[10px] uppercase tracking-widest text-(--text-faint)">
          {items.length} scraped item{items.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="max-h-80 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => {
          const id = item.item_id ?? (item as any).id
          const priority = (item.ai?.priority || 'low').toLowerCase()
          const dotColor =
            priority === 'high'   ? 'bg-(--danger)' :
            priority === 'medium' ? 'bg-(--warning)' :
                                    'bg-(--success)'
          return (
            <a
              key={id}
              href={item.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group/item flex items-start gap-2.5 rounded-md border border-transparent px-3 py-2 transition-all duration-100 hover:border-(--border) hover:bg-(--surface-hover)"
            >
              <span className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-medium leading-snug text-(--text-primary) group-hover/item:text-(--accent) transition-colors">
                  {truncate(item.title || 'Untitled', 100)}
                </p>
                <div className="flex flex-wrap items-center gap-2 font-mono-accent text-[10px] text-(--text-faint)">
                  {item.ai?.category && (
                    <span className="rounded border border-(--accent)/20 bg-(--accent-soft) px-1 py-px">
                      {item.ai.category}
                    </span>
                  )}
                  {item.ai?.summary && (
                    <span className="truncate max-w-70">
                      {truncate(item.ai.summary, 60)}
                    </span>
                  )}
                  {item.created_at && (
                    <span>{formatDate(item.created_at)}</span>
                  )}
                </div>
              </div>
              <span className="mt-0.5 shrink-0 font-mono-accent text-[10px] text-(--text-faint) opacity-0 transition-opacity group-hover/item:opacity-100">
                ↗
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default memo(FeedItemsPanel)
