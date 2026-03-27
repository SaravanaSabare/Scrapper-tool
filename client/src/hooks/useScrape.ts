import { useCallback, useState } from 'react'
import { scrapeItems } from '../services/api/items'
import type { ItemRecord, ScrapeStats } from '../types/scraper'

const emptyStats: ScrapeStats = {
  newJobsCount: 0,
  newNoticesCount: 0,
  itemsFound: 0,
  newItemsSaved: 0,
}

interface ScrapeResult {
  stats: ScrapeStats
  items: ItemRecord[]
}

interface ScrapeHookResult {
  stats: ScrapeStats
  loading: boolean
  error: Error | null
  /** Trigger a scrape.  Resolves with enriched items[] + stats. */
  trigger: (url?: string) => Promise<ScrapeResult>
}

export function useScrape(): ScrapeHookResult {
  const [stats, setStats] = useState<ScrapeStats>(emptyStats)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const trigger = useCallback(async (url = ''): Promise<ScrapeResult> => {
    setLoading(true)
    setError(null)
    try {
      // scrapeItems now returns { items: ItemRecord[], itemsFound: number }
      const data = await scrapeItems(url)
      const items: ItemRecord[] = data?.items ?? []
      const normalized: ScrapeStats = {
        newJobsCount: 0,
        newNoticesCount: 0,
        itemsFound: data?.itemsFound ?? items.length,
        newItemsSaved: 0,
      }
      setStats(normalized)
      return { stats: normalized, items }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, error, trigger }
}
