import { useCallback, useEffect, useReducer } from 'react'
import {
  fetchFeeds,
  createFeed,
  updateFeed,
  deleteFeed,
  scrapeFeedNow
} from '../services/api/feeds'
import type { FeedRecord } from '../types/scraper'

interface FeedsState {
  feeds: FeedRecord[]
  loading: boolean
  error: Error | null
  scrapingId: string | null
}

type FeedsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK'; feeds: FeedRecord[] }
  | { type: 'FETCH_ERR'; error: Error }
  | { type: 'OPTIMISTIC_ADD'; feed: FeedRecord }
  | { type: 'OPTIMISTIC_UPDATE'; feedId: string; patch: Partial<FeedRecord> }
  | { type: 'OPTIMISTIC_DELETE'; feedId: string }
  | { type: 'SCRAPE_START'; feedId: string }
  | { type: 'SCRAPE_DONE'; feedId: string; newCount: number }
  | { type: 'SCRAPE_ERR'; feedId: string }

function reducer(state: FeedsState, action: FeedsAction): FeedsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_OK':
      return { ...state, loading: false, feeds: action.feeds }
    case 'FETCH_ERR':
      return { ...state, loading: false, error: action.error }
    case 'OPTIMISTIC_ADD':
      return { ...state, feeds: [action.feed, ...state.feeds] }
    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        feeds: state.feeds.map((f) =>
          f.feed_id === action.feedId ? { ...f, ...action.patch } : f
        )
      }
    case 'OPTIMISTIC_DELETE':
      return { ...state, feeds: state.feeds.filter((f) => f.feed_id !== action.feedId) }
    case 'SCRAPE_START':
      return { ...state, scrapingId: action.feedId }
    case 'SCRAPE_DONE':
      return {
        ...state,
        scrapingId: null,
        feeds: state.feeds.map((f) =>
          f.feed_id === action.feedId
            ? { ...f, last_scraped: new Date().toISOString(), item_count: (f.item_count ?? 0) + action.newCount }
            : f
        )
      }
    case 'SCRAPE_ERR':
      return { ...state, scrapingId: null }
    default:
      return state
  }
}

export function useFeeds() {
  const [state, dispatch] = useReducer(reducer, {
    feeds: [],
    loading: false,
    error: null,
    scrapingId: null
  })

  const refresh = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const feeds = await fetchFeeds()
      dispatch({ type: 'FETCH_OK', feeds })
    } catch (err) {
      dispatch({ type: 'FETCH_ERR', error: err as Error })
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addFeed = useCallback(async (name: string, url: string, interval_minutes: number) => {
    const feed = await createFeed({ name, url, interval_minutes })
    dispatch({ type: 'OPTIMISTIC_ADD', feed })
    return feed
  }, [])

  const toggleFeed = useCallback(async (feedId: string, active: boolean) => {
    dispatch({ type: 'OPTIMISTIC_UPDATE', feedId, patch: { active } })
    try {
      await updateFeed(feedId, { active })
    } catch (err) {
      dispatch({ type: 'OPTIMISTIC_UPDATE', feedId, patch: { active: !active } })
      throw err
    }
  }, [])

  const removeFeed = useCallback(async (feedId: string) => {
    dispatch({ type: 'OPTIMISTIC_DELETE', feedId })
    try {
      await deleteFeed(feedId)
    } catch (err) {
      await refresh()
      throw err
    }
  }, [refresh])

  const scrapeOneFeed = useCallback(async (feedId: string) => {
    dispatch({ type: 'SCRAPE_START', feedId })
    try {
      const result = await scrapeFeedNow(feedId)
      dispatch({ type: 'SCRAPE_DONE', feedId, newCount: result.newCount })
      return result
    } catch (err) {
      dispatch({ type: 'SCRAPE_ERR', feedId })
      throw err
    }
  }, [])

  return {
    feeds: state.feeds,
    loading: state.loading,
    error: state.error,
    scrapingId: state.scrapingId,
    refresh,
    addFeed,
    toggleFeed,
    removeFeed,
    scrapeOneFeed
  }
}
