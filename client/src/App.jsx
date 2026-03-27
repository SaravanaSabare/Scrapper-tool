import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import AppTabs from './components/layout/AppTabs'
import ActionBar from './components/layout/ActionBar'
import PageContainer from './components/layout/PageContainer'
import ErrorBanner from './components/ui/ErrorBanner'
import LoadingState from './components/ui/LoadingState'
import StatusToast from './components/ui/StatusToast'
import { useItems } from './hooks/useItems'
import { useNotices } from './hooks/useNotices'
import { useScrape } from './hooks/useScrape'
import { sendTestSlackNotification } from './services/api/notices'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ItemsPage = lazy(() => import('./pages/ItemsPage'))
const NoticesPage = lazy(() => import('./pages/NoticesPage'))

const TAB_CONFIG = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'items', label: 'Items', icon: '📋' },
  { id: 'notices', label: 'Notices', icon: '📢' }
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [statusMessage, setStatusMessage] = useState('')

    const { items, loading: itemsLoading, error: itemsError, refresh: refreshItems } = useItems()
    const { notices, loading: noticesLoading, error: noticesError, refresh: refreshNotices } = useNotices()
    const { stats, loading: scrapeLoading, error: scrapeError, trigger: triggerScrape } = useScrape()

  const loading = itemsLoading || noticesLoading || scrapeLoading
  const error = itemsError || noticesError || scrapeError

  const tabs = useMemo(() => (
    TAB_CONFIG.map((tab) => {
      if (tab.id === 'items') return { ...tab, count: items.length }
      if (tab.id === 'notices') return { ...tab, count: notices.length }
      return tab
    })
  ), [items.length, notices.length])

  const handleTabChange = useCallback((tabId) => setActiveTab(tabId), [])

  const handleScrape = useCallback(async (url) => {
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

  const ActivePage = useMemo(() => {
    if (activeTab === 'items') return ItemsPage
    if (activeTab === 'notices') return NoticesPage
    return DashboardPage
  }, [activeTab])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        title="Dynamic Web Scraper"
        subtitle="Extract items from almost anywhere and store them locally"
      />

      <AppTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <ActionBar
        onScrape={handleScrape}
        onTestSlack={handleTestSlack}
        loading={loading}
      />

      {error && <ErrorBanner message={error.message} onRetry={handleRetry} />}
      <StatusToast message={statusMessage} />

      <main className="px-6 py-8 sm:px-10 lg:px-14">
        <Suspense fallback={<LoadingState label="Loading view..." />}>
          <PageContainer id={`panel-${activeTab}`}>
            {activeTab === 'dashboard' && (
              <ActivePage stats={stats} itemsCount={items.length} noticesCount={notices.length} />
            )}
            {activeTab === 'items' && <ActivePage items={items} />}
            {activeTab === 'notices' && <ActivePage notices={notices} />}
          </PageContainer>
        </Suspense>
      </main>
    </div>
  )
}

export { default } from './App.tsx'