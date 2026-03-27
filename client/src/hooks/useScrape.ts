import { useCallback, useState } from 'react'
import { scrapeItems } from '../services/api/items'
import type { ScrapeStats } from '../types/scraper'

const emptyStats: ScrapeStats = {
  newJobsCount: 0,
  newNoticesCount: 0,
  itemsFound: 0,
  newItemsSaved: 0
}

interface ScrapeHookResult {
  stats: ScrapeStats
  loading: boolean
  error: Error | null
  trigger: (url?: string) => Promise<ScrapeStats>
}

export function useScrape(): ScrapeHookResult {
  const [stats, setStats] = useState<ScrapeStats>(emptyStats)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const trigger = useCallback(async (url = '') => {
    setLoading(true)
    setError(null)
    try {
      const data = await scrapeItems(url)
      const normalized: ScrapeStats = {
        newJobsCount: data?.newJobsCount ?? 0,
        newNoticesCount: data?.newNoticesCount ?? 0,
        itemsFound:
          data?.itemsFound ?? (data?.newJobsCount ?? 0) + (data?.newNoticesCount ?? 0),
        newItemsSaved:
          data?.newItemsSaved ?? (data?.newJobsCount ?? 0) + (data?.newNoticesCount ?? 0)
      }
      setStats(normalized)
      return normalized
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    stats,
    loading,
    error,
    trigger
  }
}
