import { memo, useCallback, useEffect, useState } from 'react'
import { fetchAnalytics, type AnalyticsData } from '../../services/api/analytics'

// ─── Tiny bar chart (CSS-only) ──────────────────────────────────────────────

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 truncate font-mono-accent text-[10px] text-(--text-faint)" title={label}>
        {label}
      </span>
      <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-(--surface-elevated)">
        <div
          className={`absolute inset-y-0 left-0 rounded-sm transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono-accent text-[10px] font-semibold tabular-nums text-(--text-muted)">
        {value}
      </span>
    </div>
  )
}

// ─── Sparkline (last 30 days) ───────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <span className="font-mono-accent text-[10px] text-(--text-faint)">no data</span>

  const max = Math.max(...data.map((d) => d.count), 1)
  const barW = Math.max(2, Math.floor(100 / Math.max(data.length, 1)))

  return (
    <div className="flex items-end gap-px" style={{ height: 48 }} title="Items per day (last 30 days)">
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.count / max) * 44))
        return (
          <div key={d.date} className="group relative flex flex-col items-center">
            <div
              className="rounded-t-xs bg-(--accent) opacity-70 transition-opacity group-hover:opacity-100"
              style={{ width: barW, height: h }}
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded border border-(--border) bg-(--surface) px-1.5 py-0.5 font-mono-accent text-[9px] text-(--text-faint) shadow group-hover:block">
              {d.date.slice(5)}: {d.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Priority dots ──────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-(--danger)',
  medium: 'bg-(--warning)',
  low:    'bg-(--success)',
}

function PriorityBreakdown({ data }: { data: { priority: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1
  return (
    <div className="flex items-center gap-3">
      {data.map((d) => {
        const pct = Math.round((d.count / total) * 100)
        const dotColor = PRIORITY_COLORS[d.priority] || 'bg-(--border)'
        return (
          <div key={d.priority} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
            <span className="font-mono-accent text-[10px] text-(--text-faint)">
              {d.priority} {pct}%
            </span>
            <span className="font-mono-accent text-[10px] font-semibold text-(--text-muted)">
              ({d.count})
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchAnalytics()
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--accent)/30 border-t-(--accent)" />
          <span className="font-mono-accent text-xs text-(--text-faint)">loading analytics…</span>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="rounded-lg border border-(--border) bg-(--surface) p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono-accent text-xs text-(--danger)">{error || 'Failed to load analytics'}</span>
          <button onClick={load} className="font-mono-accent text-xs text-(--accent) hover:underline">retry</button>
        </div>
      </section>
    )
  }

  const { totals, items_per_day, category_breakdown, priority_breakdown, source_breakdown } = data
  const catMax = Math.max(...category_breakdown.map((c) => c.count), 1)
  const srcMax = Math.max(...source_breakdown.map((s) => s.count), 1)

  return (
    <section className="space-y-6">
      {/* Top-level analytics stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Last 24h" value={totals.items_last_24h} icon="⏱" />
        <MiniStat label="Last 7d" value={totals.items_last_7d} icon="📅" />
        <MiniStat label="From Feeds" value={totals.feed_items} icon="📡" />
        <MiniStat label="Manual Scrapes" value={totals.manual_items} icon="⬡" />
      </div>

      {/* Scrape Activity + Priority row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sparkline */}
        <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
          <h3 className="mb-3 font-mono-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            scrape activity <span className="lowercase font-normal">(30d)</span>
          </h3>
          <Sparkline data={items_per_day} />
        </div>

        {/* Priority */}
        <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
          <h3 className="mb-3 font-mono-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            priority distribution
          </h3>
          <PriorityBreakdown data={priority_breakdown} />
          {/* Mini stacked bar */}
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-(--surface-elevated)">
            {priority_breakdown.map((d) => {
              const total = priority_breakdown.reduce((s, x) => s + x.count, 0) || 1
              const pct = (d.count / total) * 100
              const color = d.priority === 'high' ? 'bg-(--danger)' : d.priority === 'medium' ? 'bg-(--warning)' : 'bg-(--success)'
              return <div key={d.priority} className={`${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            })}
          </div>
        </div>
      </div>

      {/* Category + Source row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Categories */}
        <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
          <h3 className="mb-3 font-mono-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            categories
          </h3>
          <div className="space-y-1.5">
            {category_breakdown.slice(0, 8).map((c) => (
              <Bar key={c.category} label={c.category} value={c.count} max={catMax} color="bg-(--accent)" />
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="rounded-lg border border-(--border) bg-(--surface) p-5">
          <h3 className="mb-3 font-mono-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            top sources
          </h3>
          <div className="space-y-1.5">
            {source_breakdown.slice(0, 8).map((s) => (
              <Bar key={s.source} label={s.source} value={s.count} max={srcMax} color="bg-(--text-muted)/40" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Helper: small stat ─────────────────────────────────────────────────────

function MiniStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-(--border) bg-(--surface) px-4 py-3 transition-all duration-150 hover:border-(--accent)/30">
      <span className="text-base" aria-hidden="true">{icon}</span>
      <div>
        <p className="font-mono-accent text-lg font-bold tabular-nums text-(--text-primary)">{value}</p>
        <p className="font-mono-accent text-[10px] text-(--text-faint)">{label}</p>
      </div>
    </div>
  )
}

export default memo(AnalyticsPanel)
