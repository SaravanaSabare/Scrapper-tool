import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { deepScrape, type DeepScrapeResult } from '../../services/api/analytics'
import { formatDate } from '../../utils/formatters'

interface DeepScrapeDrawerProps {
  url: string | null
  onClose: () => void
}

function DeepScrapeDrawer({ url, onClose }: DeepScrapeDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<DeepScrapeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url) { setData(null); return }
    let cancelled = false
    setLoading(true)
    setError('')
    deepScrape(url)
      .then((result) => { if (!cancelled) setData(result) })
      .catch((err) => { if (!cancelled) setError((err as Error).message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [url])

  // Close on Escape
  useEffect(() => {
    if (!url) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [url, onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    },
    [onClose]
  )

  if (!url) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Deep scrape results"
    >
      <div
        ref={panelRef}
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-(--border) bg-(--surface) shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--surface)/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0 flex-1">
            <h2 className="font-mono-accent text-xs font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
              🔬 deep scrape
            </h2>
            <p className="mt-0.5 truncate font-mono-accent text-[10px] text-(--text-faint)" title={url}>
              {url}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--border) bg-(--surface-elevated) font-mono-accent text-xs text-(--text-faint) transition hover:border-(--danger)/40 hover:text-(--danger)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-(--accent)/30 border-t-(--accent)" />
              <span className="font-mono-accent text-xs text-(--text-faint)">Extracting full content…</span>
              <span className="font-mono-accent text-[10px] text-(--text-faint)">This may take 10-30 seconds</span>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-(--danger)/30 bg-(--danger)/5 p-4">
              <p className="font-mono-accent text-xs text-(--danger)">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Hero image */}
              {data.og_image && (
                <div className="overflow-hidden rounded-lg border border-(--border)">
                  <img
                    src={data.og_image}
                    alt=""
                    className="w-full object-cover"
                    style={{ maxHeight: 240 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}

              {/* Title + meta */}
              <div>
                <h3 className="text-lg font-semibold leading-snug text-(--text-primary)">
                  {data.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-accent text-[11px] text-(--text-faint)">
                  {data.author && <span>by {data.author}</span>}
                  {data.published_date && <span>· {formatDate(data.published_date)}</span>}
                  <span>· {data.word_count.toLocaleString()} words</span>
                  <span>· {data.images.length} image{data.images.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* AI Summary */}
              {data.ai && (
                <div className="rounded-md border border-(--accent)/30 bg-(--accent-soft) p-4 space-y-2">
                  <p className="font-mono-accent text-[10px] font-semibold uppercase tracking-widest text-(--accent)">
                    AI summary
                  </p>
                  <p className="text-sm leading-relaxed text-(--text-primary)">
                    {data.ai.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {data.ai.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-(--accent)/20 bg-(--surface) px-2 py-0.5 font-mono-accent text-[10px] text-(--accent)"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className={`ml-auto rounded border px-1.5 py-0.5 font-mono-accent text-[10px] font-semibold ${
                      data.ai.priority === 'high'   ? 'border-(--danger)/30 text-(--danger)' :
                      data.ai.priority === 'medium' ? 'border-(--warning)/30 text-(--warning)' :
                                                      'border-(--success)/30 text-(--success)'
                    }`}>
                      {data.ai.priority}
                    </span>
                    <span className="rounded border border-(--accent)/20 bg-(--accent-soft) px-1.5 py-0.5 font-mono-accent text-[10px] text-(--accent)">
                      {data.ai.category}
                    </span>
                  </div>
                  {data.ai.action_items.length > 0 && (
                    <div className="pt-1">
                      <p className="font-mono-accent text-[10px] font-semibold text-(--text-faint)">Action items:</p>
                      <ul className="mt-1 space-y-0.5 pl-3">
                        {data.ai.action_items.map((a, i) => (
                          <li key={i} className="text-xs text-(--text-muted) list-disc">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Full content */}
              <div>
                <p className="mb-2 font-mono-accent text-[10px] font-semibold uppercase tracking-widest text-(--text-faint)">
                  extracted content
                </p>
                <div className="max-h-96 overflow-y-auto rounded-md border border-(--border) bg-(--surface-elevated) p-4 scrollbar-thin">
                  {data.full_content.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-3 text-sm leading-relaxed text-(--text-muted)">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* Images grid */}
              {data.images.length > 1 && (
                <div>
                  <p className="mb-2 font-mono-accent text-[10px] font-semibold uppercase tracking-widest text-(--text-faint)">
                    images ({data.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {data.images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-md border border-(--border) transition hover:border-(--accent)/40">
                        <img
                          src={src}
                          alt=""
                          className="h-24 w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Open original */}
              <div className="pt-2">
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-(--accent)/40 bg-(--accent-soft) px-4 py-2 font-mono-accent text-xs text-(--accent) transition hover:opacity-80"
                >
                  Open original ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(DeepScrapeDrawer)
