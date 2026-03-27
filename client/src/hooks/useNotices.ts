import { useAsync } from './useAsync'
import { fetchNotices } from '../services/api/notices'
import type { NoticeRecord } from '../types/scraper'

interface NoticesHookResult {
  notices: NoticeRecord[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<NoticeRecord[]>
}

export function useNotices(): NoticesHookResult {
  const { execute, value, loading, error } = useAsync<NoticeRecord[], []>(fetchNotices, [], true)

  return {
    notices: value || [],
    loading,
    error,
    refresh: execute
  }
}
