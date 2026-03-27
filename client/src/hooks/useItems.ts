import { useState, useCallback } from 'react'
import type { ItemRecord } from '../types/scraper'

interface ItemsHookResult {
  items: ItemRecord[]
  setItems: (items: ItemRecord[]) => void
  removeItem: (id: string) => void
  clearAll: () => void
}

/**
 * Session-only item store.  No API fetches — items are populated by the
 * scrape response and live entirely in React state.  Refreshing the page
 * clears the session (by design).
 */
export function useItems(): ItemsHookResult {
  const [items, setItemsState] = useState<ItemRecord[]>([])

  const setItems = useCallback((next: ItemRecord[]) => {
    setItemsState(next)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItemsState(prev => prev.filter(i => (i.item_id ?? (i as any).id) !== id))
  }, [])

  const clearAll = useCallback(() => setItemsState([]), [])

  return { items, setItems, removeItem, clearAll }
}
