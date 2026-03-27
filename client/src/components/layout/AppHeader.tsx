import { useHealth } from '../../hooks/useHealth.ts'

interface StatusBadgeProps {
  label: string
  active?: boolean
  dim?: boolean
}

function StatusBadge({ label, active = true, dim = false }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-(--border) bg-(--surface-elevated) px-2.5 py-1 font-mono-accent text-xs ${dim ? 'text-(--text-faint)' : 'text-(--text-muted)'}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-(--success) animate-pulse-dot' : 'bg-(--text-faint)'}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

interface AppHeaderProps {
  title: string
  subtitle: string
}

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const health = useHealth()

  const dbOk  = health ? health.db === 'connected' : true
  const aiLabel = health ? (health.ai === 'groq' ? 'groq ai' : 'ai (heuristic)') : 'ai'

  return (
    <header className="relative overflow-hidden border-b border-(--border) bg-(--surface)">
      {/* Animated gradient noise layer */}
      <div
        className="animate-gradient-shift pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,106,247,0.15),transparent)] opacity-100"
        aria-hidden="true"
      />
      {/* Grid line texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(124,106,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,106,247,0.03)_1px,transparent_1px)] bg-size-[40px_40px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono-accent text-xs font-semibold uppercase tracking-[0.3em] text-(--accent)">
                ⬡ universal-scraper
              </span>
            </div>
            <div>
              <h1 className="font-mono-accent text-2xl font-bold tracking-tight text-(--text-primary) sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1.5 max-w-md text-sm text-(--text-muted)">{subtitle}</p>
            </div>
          </div>

          {/* Right: pipeline status */}
          <div className="flex flex-col gap-2">
            <p className="font-mono-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-(--text-faint)">
              pipeline status
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="scraper"  active />
              <StatusBadge label={aiLabel}  active={health ? health.ai === 'groq' : true} dim={health?.ai !== 'groq'} />
              <StatusBadge label="supabase" active={dbOk} />
              <StatusBadge label="slack"    active={false} dim />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
