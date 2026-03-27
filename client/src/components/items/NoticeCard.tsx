import { memo, useState } from 'react'
import { formatDate, truncate } from '../../utils/formatters'
import type { NoticeRecord } from '../../types/scraper'

interface NoticeCardProps {
  notice: NoticeRecord
}

function NoticeCard({ notice }: NoticeCardProps) {
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <article className="group rounded-lg border border-(--border) bg-(--surface) transition-all duration-150 hover:border-(--accent)/40 hover:bg-(--surface-hover)">
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {notice.notice_type && (
              <span className="font-mono-accent rounded border border-(--accent)/25 bg-(--accent-soft) px-1.5 py-0.5 text-[10px] text-(--accent)">
                {notice.notice_type}
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium leading-snug text-(--text-primary)">
            {truncate(notice.title || 'Notice', 90)}
          </h3>

          <div className="flex flex-wrap items-center gap-3 font-mono-accent text-[11px] text-(--text-faint)">
            {notice.posted_date && <span>{formatDate(notice.posted_date)}</span>}
            {notice.content && <span>· {truncate(notice.content, 60)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {notice.ai && (
            <button
              type="button"
              onClick={() => setAiOpen((o) => !o)}
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
          {notice.link && (
            <a
              href={notice.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 font-mono-accent text-[10px] text-(--text-faint) transition-all duration-150 hover:border-(--accent)/30 hover:text-(--accent)"
              aria-label="Open notice link"
            >
              ↗
            </a>
          )}
        </div>
      </div>

      {/* AI accordion */}
      {notice.ai && aiOpen && (
        <div className="animate-slide-down border-t border-(--border) bg-(--surface-elevated) px-4 py-3">
          {notice.ai.summary && (
            <p className="text-xs text-(--text-muted)">{notice.ai.summary}</p>
          )}
          {notice.ai.tags && notice.ai.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {notice.ai.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono-accent rounded border border-(--border) bg-(--surface) px-2 py-0.5 text-[10px] text-(--text-faint)"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {notice.ai.action_items && notice.ai.action_items.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {notice.ai.action_items.map((action) => (
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

export default memo(NoticeCard)
