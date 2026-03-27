import { memo } from 'react'

export interface TabConfig {
  id: 'dashboard' | 'items' | 'notices' | 'feeds'
  label: string
  icon: string
  count?: number
}

interface AppTabsProps {
  tabs: TabConfig[]
  activeTab: TabConfig['id']
  onChange: (tabId: TabConfig['id']) => void
}

function AppTabs({ tabs, activeTab, onChange }: AppTabsProps) {
  return (
    <nav
      className="border-b border-(--border) bg-(--surface) px-6 sm:px-10 lg:px-14"
      role="tablist"
      aria-label="Sections"
    >
      <div className="mx-auto flex max-w-6xl gap-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              className={`relative flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-inset ${
                isActive
                  ? 'border-(--accent) text-(--text-primary)'
                  : 'border-transparent text-(--text-muted) hover:border-(--border) hover:text-(--text-primary)'
              }`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
            >
              <span className="font-mono-accent text-xs" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`rounded px-1.5 py-0.5 font-mono-accent text-[10px] font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-(--accent-soft) text-(--accent)'
                      : 'bg-(--surface-elevated) text-(--text-faint)'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default memo(AppTabs)
