import { useState, useRef, useEffect } from 'react'
import { useResearch } from '../../hooks/useResearch.ts'
import type { ItemRecord } from '../../types/scraper'

interface ResearchPanelProps {
  items: ItemRecord[]
  isOpen: boolean
  onClose: () => void
}

export default function ResearchPanel({ items, isOpen, onClose }: ResearchPanelProps) {
  const [question, setQuestion] = useState('')
  const { history, loading, error, askQuestion, clearHistory } = useResearch()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 120)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAsk = async () => {
    if (!question.trim() || loading || items.length === 0) return
    const q = question
    setQuestion('')
    await askQuestion(q, items)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides up from bottom */}
      <div
        role="dialog"
        aria-label="Research panel"
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl border-t border-(--border) bg-(--surface) shadow-2xl animate-slide-up"
      >
        {/* Handle + header */}
        <div className="flex shrink-0 items-center justify-between border-b border-(--border) px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-base">🔬</span>
            <div>
              <p className="font-mono-accent text-xs font-semibold uppercase tracking-widest text-(--text-faint)">
                research
              </p>
              <p className="text-sm font-medium text-(--text-primary)">
                Ask questions about your session items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="font-mono-accent rounded-md border border-(--border) px-2.5 py-1 text-[10px] text-(--text-faint) transition hover:border-(--danger)/40 hover:text-(--danger)"
              >
                Clear history
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-(--border) text-sm text-(--text-faint) transition hover:border-(--accent)/40 hover:text-(--accent)"
              aria-label="Close research panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Q&A history */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <p className="font-mono-accent text-xs text-(--text-faint) text-center py-8">
              No session items — scrape a URL first, then ask questions.
            </p>
          )}

          {history.length === 0 && items.length > 0 && (
            <div className="rounded-md border border-(--border) bg-(--surface-elevated) px-4 py-3 text-center">
              <p className="font-mono-accent text-xs text-(--text-faint)">
                {items.length} item{items.length === 1 ? '' : 's'} in session.
                Ask anything — e.g. "What are the most urgent items?" or "Summarise the high-priority findings."
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 rounded-md border border-(--border) bg-(--surface-elevated) px-4 py-3">
              <span className="font-mono-accent text-xs text-(--accent) animate-pulse">● thinking…</span>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-(--danger)/30 bg-(--danger)/5 px-4 py-3">
              <p className="font-mono-accent text-xs text-(--danger)">{error.message}</p>
            </div>
          )}

          {history.map((qa, i) => (
            <div key={i} className="space-y-2">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-(--accent) px-4 py-2.5">
                  <p className="text-sm text-white leading-relaxed">{qa.question}</p>
                </div>
              </div>
              {/* Answer bubble */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-(--border) bg-(--surface-elevated) px-4 py-3">
                  <p className="text-sm text-(--text-primary) leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-(--border) px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the scraped items… (Enter to send)"
              rows={2}
              disabled={loading || items.length === 0}
              className="flex-1 resize-none rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--text-primary) placeholder:text-(--text-faint) focus:border-(--accent)/60 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || loading || items.length === 0}
              className="mb-0.5 rounded-xl bg-(--accent) px-5 py-3 font-mono-accent text-sm text-white transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '…' : 'Ask'}
            </button>
          </div>
          <p className="mt-2 font-mono-accent text-[10px] text-(--text-faint)">
            Rate limited to 5 questions/min · answers are based solely on scraped content
          </p>
        </div>
      </div>
    </>
  )
}

