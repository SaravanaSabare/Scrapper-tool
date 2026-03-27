import apiClient from './client'
import type { FeedRecord } from '../../types/scraper'

interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
}

export async function fetchFeeds(): Promise<FeedRecord[]> {
  const { data } = await apiClient.get<ApiResponse<FeedRecord[]>>('/feeds')
  return data.data
}

export async function createFeed(payload: {
  name: string
  url: string
  interval_minutes: number
}): Promise<FeedRecord> {
  const { data } = await apiClient.post<ApiResponse<FeedRecord>>('/feeds', payload)
  return data.data
}

export async function updateFeed(
  feedId: string,
  patch: Partial<Pick<FeedRecord, 'name' | 'url' | 'interval_minutes' | 'active'>>
): Promise<FeedRecord> {
  const { data } = await apiClient.patch<ApiResponse<FeedRecord>>(`/feeds/${feedId}`, patch)
  return data.data
}

export async function deleteFeed(feedId: string): Promise<void> {
  await apiClient.delete(`/feeds/${feedId}`)
}

export async function scrapeFeedNow(feedId: string): Promise<{ feedId: string; newCount: number }> {
  const { data } = await apiClient.post<ApiResponse<{ feedId: string; newCount: number }>>(
    `/feeds/${feedId}/scrape`
  )
  return data.data
}
