import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader.tsx'
import AppTabs, { type TabConfig } from './components/layout/AppTabs.tsx'
import ActionBar from './components/layout/ActionBar.tsx'
import PageContainer from './components/layout/PageContainer.tsx'
import ErrorBanner from './components/ui/ErrorBanner.tsx'
import ErrorBoundary from './components/ui/ErrorBoundary.tsx'
import LoadingState from './components/ui/LoadingState.tsx'
import StatusToast from './components/ui/StatusToast.tsx'
import { useItems } from './hooks/useItems.ts'
import { useNotices } from './hooks/useNotices.ts'
import { useScrape } from './hooks/useScrape.ts'
import { useFeeds } from './hooks/useFeeds.ts'
import { sendTestSlackNotification } from './services/api/notices'

const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'))
const ItemsPage = lazy(() => import('./pages/ItemsPage.tsx'))
const NoticesPage = lazy(() => import('./pages/NoticesPage.tsx'))
const FeedsPage = lazy(() => import('./pages/FeedsPage.tsx'))

const TAB_CONFIG: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'items',     label: 'Items',     icon: '📋' },
  { id: 'notices',   label: 'Notices',   icon: '📢' },
  { id: 'feeds',     label: 'Feeds',     icon: '📡' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabConfig['id']>('dashboard')
  const [statusMessage, setStatusMessage] = useState('')

  const { items, loading: itemsLoading, error: itemsError, refresh: refreshItems, deleteItem } = useItems()
  const { notices, loading: noticesLoading, error: noticesError, refresh: refreshNotices } = useNotices()
  const { stats, loading: scrapeLoading, error: scrapeError, trigger: triggerScrape } = useScrape()
  const { feeds } = useFeeds()

  const loading = itemsLoading || noticesLoading || scrapeLoading
  const error = itemsError || noticesError || scrapeError

  const tabs = useMemo(() => (
    TAB_CONFIG.map((tab) => {
      if (tab.id === 'items')  return { ...tab, count: items.length }
      if (tab.id === 'notices') return { ...tab, count: notices.length }
      if (tab.id === 'feeds')  return { ...tab, count: feeds.length || undefined }
      return tab
    })
  ), [items.length, notices.length, feeds.length])

  const handleTabChange = useCallback((tabId: TabConfig['id']) => setActiveTab(tabId), [])

  const handleScrape = useCallback(async (url?: string) => {
    try {
      await triggerScrape(url)
      await Promise.all([refreshItems(), refreshNotices()])
      setStatusMessage('Scrape completed successfully.')
    } catch (err) {
      setStatusMessage('')
    }
  }, [triggerScrape, refreshItems, refreshNotices])

  const handleTestSlack = useCallback(async () => {
    try {
      await sendTestSlackNotification()
      setStatusMessage('Test Slack notification sent.')
    } catch (err) {
      setStatusMessage('')
    }
  }, [])

  const handleRetry = useCallback(() => {
    refreshItems()
    refreshNotices()
  }, [refreshItems, refreshNotices])

  useEffect(() => {
    if (!statusMessage) return undefined
    const timer = setTimeout(() => setStatusMessage(''), 3200)
    return () => clearTimeout(timer)
  }, [statusMessage])

  return (
  <div className="min-h-screen bg-(--app-bg) text-(--text-primary)">
      <AppHeader
        title="web-scraper"
        subtitle="Scrape any URL on a schedule, enrich with AI analysis, store to Supabase."
      />

      <AppTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <ActionBar
        onScrape={handleScrape}
        onTestSlack={handleTestSlack}
        loading={loading}
      />

      {error && <ErrorBanner message={error.message} onRetry={handleRetry} />}
      <StatusToast message={statusMessage} />

      <main className="mx-auto max-w-6xl px-6 py-6 sm:px-10 lg:px-14">
        <ErrorBoundary>
          <Suspense fallback={<LoadingState label="loading view..." />}>
            <PageContainer id={`panel-${activeTab}`}>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  stats={stats}
                  itemsCount={items.length}
                  noticesCount={notices.length}
                  feeds={feeds}
                />
              )}
              {activeTab === 'items' && <ItemsPage items={items} feeds={feeds} onDeleteItem={deleteItem} />}
              {activeTab === 'notices' && <NoticesPage notices={notices} />}
              {activeTab === 'feeds' && <FeedsPage />}
            </PageContainer>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
