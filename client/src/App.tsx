import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react"
import AppHeader from "./components/layout/AppHeader.tsx"
import AppTabs, { type TabConfig } from "./components/layout/AppTabs.tsx"
import ActionBar from "./components/layout/ActionBar.tsx"
import PageContainer from "./components/layout/PageContainer.tsx"
import ErrorBanner from "./components/ui/ErrorBanner.tsx"
import ErrorBoundary from "./components/ui/ErrorBoundary.tsx"
import LoadingState from "./components/ui/LoadingState.tsx"
import StatusToast from "./components/ui/StatusToast.tsx"
import { useItems } from "./hooks/useItems.ts"
import { useNotices } from "./hooks/useNotices.ts"
import { useScrape } from "./hooks/useScrape.ts"
import { useFeeds } from "./hooks/useFeeds.ts"
import { sendTestSlackNotification } from "./services/api/notices"

const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"))
const ItemsPage     = lazy(() => import("./pages/ItemsPage.tsx"))
const NoticesPage   = lazy(() => import("./pages/NoticesPage.tsx"))
const FeedsPage     = lazy(() => import("./pages/FeedsPage.tsx"))
const ResearchPanel = lazy(() => import("./components/research/ResearchPanel.tsx"))

const TAB_CONFIG: TabConfig[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "items",     label: "Items",     icon: "📋" },
  { id: "notices",   label: "Notices",   icon: "📢" },
  { id: "feeds",     label: "Feeds",     icon: "📡" },
]

export default function App() {
  const [activeTab, setActiveTab]         = useState<TabConfig["id"]>("dashboard")
  const [statusMessage, setStatusMessage] = useState("")
  const [researchOpen, setResearchOpen]   = useState(false)

  const { items, setItems, removeItem, clearAll } = useItems()
  const { notices, loading: noticesLoading, error: noticesError, refresh: refreshNotices } = useNotices()
  const { stats, loading: scrapeLoading, error: scrapeError, trigger: triggerScrape } = useScrape()
  const { feeds } = useFeeds()

  const loading = noticesLoading || scrapeLoading
  const error   = noticesError || scrapeError

  const tabs = useMemo(() =>
    TAB_CONFIG.map((tab) => {
      if (tab.id === "items")   return { ...tab, count: items.length   || undefined }
      if (tab.id === "notices") return { ...tab, count: notices.length || undefined }
      if (tab.id === "feeds")   return { ...tab, count: feeds.length   || undefined }
      return tab
    }),
    [items.length, notices.length, feeds.length]
  )

  const handleTabChange = useCallback((tabId: TabConfig["id"]) => setActiveTab(tabId), [])

  const handleScrape = useCallback(async (url?: string) => {
    try {
      const { items: scraped, stats: s } = await triggerScrape(url)
      setItems(scraped)
      if (scraped.length > 0) setActiveTab("items")
      setStatusMessage(`Scraped ${s.itemsFound} items - session loaded.`)
      await refreshNotices()
    } catch {
      setStatusMessage("")
    }
  }, [triggerScrape, setItems, refreshNotices])

  const handleTestSlack = useCallback(async () => {
    try {
      await sendTestSlackNotification()
      setStatusMessage("Test Slack notification sent.")
    } catch {
      setStatusMessage("")
    }
  }, [])

  useEffect(() => {
    if (!statusMessage) return undefined
    const timer = setTimeout(() => setStatusMessage(""), 4000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  return (
    <div className="min-h-screen bg-(--app-bg) text-(--text-primary)">
      <AppHeader
        title="web-scraper"
        subtitle="Scrape any URL - items live in this session only. Enrich with AI, then research."
      />

      <AppTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <ActionBar
        onScrape={handleScrape}
        onTestSlack={handleTestSlack}
        loading={loading}
      />

      {error && <ErrorBanner message={error.message} onRetry={refreshNotices} />}
      <StatusToast message={statusMessage} />

      <main className="mx-auto max-w-6xl px-6 py-6 sm:px-10 lg:px-14">
        <ErrorBoundary>
          <Suspense fallback={<LoadingState label="loading view..." />}>
            <PageContainer id={`panel-${activeTab}`}>
              {activeTab === "dashboard" && (
                <DashboardPage
                  stats={stats}
                  itemsCount={items.length}
                  noticesCount={notices.length}
                  feeds={feeds}
                />
              )}
              {activeTab === "items" && (
                <ItemsPage
                  items={items}
                  feeds={feeds}
                  onRemoveItem={removeItem}
                  onClearAll={clearAll}
                  onOpenResearch={() => setResearchOpen(true)}
                />
              )}
              {activeTab === "notices" && <NoticesPage notices={notices} />}
              {activeTab === "feeds"   && <FeedsPage />}
            </PageContainer>
          </Suspense>
        </ErrorBoundary>
      </main>

      <ErrorBoundary>
        <Suspense fallback={null}>
          <ResearchPanel
            items={items}
            isOpen={researchOpen}
            onClose={() => setResearchOpen(false)}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
