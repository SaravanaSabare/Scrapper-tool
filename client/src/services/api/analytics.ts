import apiClient from './client'

export interface AnalyticsData {
  items_per_day: { date: string; count: number }[]
  category_breakdown: { category: string; count: number }[]
  priority_breakdown: { priority: string; count: number }[]
  source_breakdown: { source: string; count: number }[]
  feed_timeline: { feed_name: string; date: string; count: number }[]
  totals: {
    total_items: number
    total_notices: number
    active_feeds: number
    items_last_24h: number
    items_last_7d: number
    feed_items: number
    manual_items: number
  }
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await apiClient.get<{ success: boolean; data: AnalyticsData }>('/analytics')
  return data.data
}

export interface DeepScrapeResult {
  url: string
  title: string
  description: string
  author: string | null
  published_date: string | null
  full_content: string
  word_count: number
  images: string[]
  og_image: string | null
  ai: {
    summary: string
    tags: string[]
    category: string
    priority: string
    action_items: string[]
  }
}

export async function deepScrape(url: string): Promise<DeepScrapeResult> {
  const { data } = await apiClient.post<{ success: boolean; data: DeepScrapeResult }>(
    '/jobs/deep-scrape',
    { url }
  )
  return data.data
}
