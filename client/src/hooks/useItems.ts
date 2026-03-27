import { useCallback } from 'react'
import { useAsync } from './useAsync'
import { fetchItems, deleteItem as apiDeleteItem } from '../services/api/items'
import type { ItemRecord } from '../types/scraper'

interface ItemsHookResult {
  items: ItemRecord[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<ItemRecord[]>
  deleteItem: (id: string) => Promise<void>
}

export function useItems(): ItemsHookResult {
  const { execute, value, loading, error } = useAsync<ItemRecord[], []>(fetchItems, [], true)

  const deleteItem = useCallback(async (id: string) => {
    await apiDeleteItem(id)
    await execute()
  }, [execute])

  return {
    items: value || [],
    loading,
    error,
    refresh: execute,
    deleteItem,
  }
}
