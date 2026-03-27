import { memo } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  helper: string
  icon?: string
  accent?: boolean
}

function StatCard({ label, value, helper, icon, accent = false }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-(--surface) p-5 transition-all duration-150 hover:border-(--accent)/50 hover:bg-(--surface-hover) ${
        accent ? 'border-(--accent)/40' : 'border-(--border)'
      }`}
    >
      {accent && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,var(--accent-soft),transparent)]"
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-faint)">
            {label}
          </p>
          <p
            className={`mt-2 font-mono-accent text-3xl font-bold tabular-nums tracking-tight ${
              accent ? 'text-(--accent)' : 'text-(--text-primary)'
            }`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-(--text-muted)">{helper}</p>
        </div>
        {icon && (
          <span
            className="shrink-0 rounded-md border border-(--border) bg-(--surface-elevated) p-2 text-base leading-none text-(--text-muted)"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(StatCard)
