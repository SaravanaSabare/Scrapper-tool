import { memo, useCallback, useEffect, useRef } from 'react'
import { formatDate } from '../../utils/formatters'
import type { ItemRecord } from '../../types/scraper'

interface ItemDrawerProps {
  item: ItemRecord | null
  onClose: () => void
  onDelete?: (id: string) => void
}

function ItemDrawer({ item, onClose, onDelete }: ItemDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!item) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [item, onClose])

  // Close on click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    },
    [onClose]
  )

  if (!item) return null

  const priority = (item.ai?.priority || '').toLowerCase()
  const priorityColor =
    priority === 'high'   ? 'text-(--danger)' :
    priority === 'medium' ? 'text-(--warning)' :
                            'text-(--success)'

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Item details"
    >
      <div
        ref={panelRef}
        className="h-full w-full max-w-lg overflow-y-auto border-l border-(--border) bg-(--surface) shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--surface)/95 px-6 py-4 backdrop-blur-sm">
          <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            item details
          </h2>
          <div className="flex items-center gap-2">
            {onDelete && item.item_id && (
              <button
                onClick={() => { onDelete(item.item_id!); onClose() }}
                className="rounded-md border border-(--danger)/30 bg-(--danger)/10 px-3 py-1.5 font-mono-accent text-[11px] text-(--danger) transition hover:bg-(--danger)/20"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-1.5 font-mono-accent text-[11px] text-(--text-faint) transition hover:text-(--text-primary)"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {item.ai?.priority && (
              <span className={`font-mono-accent rounded border border-current/30 px-2 py-1 text-[11px] font-bold ${priorityColor}`}>
                {priority} priority
              </span>
            )}
            {item.ai?.category && (
              <span className="font-mono-accent rounded border border-(--accent)/25 bg-(--accent-soft) px-2 py-1 text-[11px] text-(--accent)">
                {item.ai.category}
              </span>
            )}
            {item.source && (
              <span className="font-mono-accent rounded border border-(--border) bg-(--surface-elevated) px-2 py-1 text-[11px] text-(--text-faint)">
                {item.source}
              </span>
            )}
            {item.job_type && (
              <span className="font-mono-accent rounded border border-(--border) bg-(--surface-elevated) px-2 py-1 text-[11px] text-(--text-faint)">
                {item.job_type}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold leading-snug text-(--text-primary)">
            {item.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 font-mono-accent text-xs text-(--text-faint)">
            {item.company && <span>🏢 {item.company}</span>}
            {item.location && <span>📍 {item.location}</span>}
            {item.salary && <span>💰 {item.salary}</span>}
            {item.posted_date && <span>📅 {formatDate(item.posted_date)}</span>}
          </div>

          {/* Link */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-(--accent)/30 bg-(--accent-soft) px-3 py-2 font-mono-accent text-xs text-(--accent) transition hover:bg-(--accent)/20"
            >
              ↗ Open source link
            </a>
          )}

          {/* Description */}
          {item.description && (
            <section>
              <h4 className="font-mono-accent mb-2 text-[11px] font-semibold uppercase tracking-widest text-(--text-faint)">
                description
              </h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--text-muted)">
                {item.description}
              </p>
            </section>
          )}

          {/* AI Insights */}
          {item.ai && (
            <section className="rounded-lg border border-(--accent)/20 bg-(--accent-soft) p-4 space-y-4">
              <h4 className="font-mono-accent text-[11px] font-semibold uppercase tracking-widest text-(--accent)">
                ◈ ai insights
              </h4>

              {item.ai.summary && (
                <div>
                  <p className="font-mono-accent mb-1 text-[10px] text-(--text-faint)">Summary</p>
                  <p className="text-sm text-(--text-primary)">{item.ai.summary}</p>
                </div>
              )}

              {item.ai.tags && item.ai.tags.length > 0 && (
                <div>
                  <p className="font-mono-accent mb-2 text-[10px] text-(--text-faint)">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.ai.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-(--border) bg-(--surface) px-2.5 py-0.5 font-mono-accent text-[10px] text-(--text-muted)"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.ai.action_items && item.ai.action_items.length > 0 && (
                <div>
                  <p className="font-mono-accent mb-2 text-[10px] text-(--text-faint)">Action Items</p>
                  <ul className="space-y-1.5">
                    {item.ai.action_items.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-(--text-muted)">
                        <span className="font-mono-accent mt-0.5 text-(--accent)">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(ItemDrawer)
