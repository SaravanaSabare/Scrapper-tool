import { memo, useState } from 'react'
import { formatDate, truncate } from '../../utils/formatters'
import type { ItemRecord } from '../../types/scraper'

interface ItemCardProps {
  item: ItemRecord
  feedName?: string
  onClick?: () => void
}

export type { ItemCardProps }

const priorityStyles: Record<string, { label: string; color: string }> = {
  high:   { label: 'high',   color: 'text-(--danger) border-(--danger)/30 bg-(--danger)/8' },
  medium: { label: 'med',    color: 'text-(--warning) border-(--warning)/30 bg-(--warning)/8' },
  low:    { label: 'low',    color: 'text-(--success) border-(--success)/30 bg-(--success)/8' },
}

function getPriorityStyle(priority?: string) {
  const key = (priority || '').toLowerCase()
  return priorityStyles[key] ?? priorityStyles.low
}

function ItemCard({ item, feedName, onClick }: ItemCardProps) {
  const [aiOpen, setAiOpen] = useState(false)
  const priority = getPriorityStyle(item.ai?.priority)

  return (
    <article
      className="group cursor-pointer rounded-lg border border-(--border) bg-(--surface) transition-all duration-150 hover:border-(--accent)/40 hover:bg-(--surface-hover)"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {item.job_type && (
              <span className="font-mono-accent rounded border border-(--border) bg-(--surface-elevated) px-1.5 py-0.5 text-[10px] text-(--text-faint)">
                {item.job_type}
              </span>
            )}
            {feedName && (
              <span className="font-mono-accent rounded border border-(--border) bg-(--surface-elevated) px-1.5 py-0.5 text-[10px] text-(--text-faint)">
                📡 {feedName}
              </span>
            )}
            {item.ai?.priority && (
              <span className={`font-mono-accent rounded border px-1.5 py-0.5 text-[10px] font-semibold ${priority.color}`}>
                {priority.label}
              </span>
            )}
            {item.ai?.category && (
              <span className="font-mono-accent rounded border border-(--accent)/25 bg-(--accent-soft) px-1.5 py-0.5 text-[10px] text-(--accent)">
                {item.ai.category}
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium leading-snug text-(--text-primary)">
            {truncate(item.title || 'Untitled', 90)}
          </h3>

          <div className="flex flex-wrap items-center gap-3 font-mono-accent text-[11px] text-(--text-faint)">
            {item.company && <span>{item.company}</span>}
            {item.location && <span>· {item.location}</span>}
            {item.posted_date && <span>· {formatDate(item.posted_date)}</span>}
            {item.salary && <span>· {item.salary}</span>}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1">
          {item.ai && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setAiOpen((o) => !o) }}
              className={`rounded-md border px-2 py-1 font-mono-accent text-[10px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${
                aiOpen
                  ? 'border-(--accent)/40 bg-(--accent-soft) text-(--accent)'
                  : 'border-(--border) bg-(--surface-elevated) text-(--text-faint) hover:border-(--accent)/30 hover:text-(--accent)'
              }`}
              aria-expanded={aiOpen}
              aria-label="Toggle AI insights"
            >
              AI
            </button>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 font-mono-accent text-[10px] text-(--text-faint) transition-all duration-150 hover:border-(--accent)/30 hover:text-(--accent)"
              aria-label="Open source link"
            >
              ↗
            </a>
          )}
        </div>
      </div>

      {/* AI accordion */}
      {item.ai && aiOpen && (
        <div className="animate-slide-down border-t border-(--border) bg-(--surface-elevated) px-4 py-3">
          {item.ai.summary && (
            <p className="text-xs text-(--text-muted)">{item.ai.summary}</p>
          )}
          {item.ai.tags && item.ai.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.ai.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono-accent rounded border border-(--border) bg-(--surface) px-2 py-0.5 text-[10px] text-(--text-faint)"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {item.ai.action_items && item.ai.action_items.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {item.ai.action_items.map((action) => (
                <li key={action} className="flex items-start gap-2 text-[11px] text-(--text-muted)">
                  <span className="font-mono-accent mt-px text-[10px] text-(--accent)" aria-hidden="true">→</span>
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}

export default memo(ItemCard)
