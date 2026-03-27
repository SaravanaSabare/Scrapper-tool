import { useState, useCallback } from 'react'
import { researchItems } from '../services/api/items'
import type { ItemRecord } from '../types/scraper'

export interface QAPair {
  question: string
  answer: string
}

interface ResearchHookResult {
  history: QAPair[]
  loading: boolean
  error: Error | null
  askQuestion: (question: string, items: ItemRecord[]) => Promise<void>
  clearHistory: () => void
}

const MAX_HISTORY = 5

export function useResearch(): ResearchHookResult {
  const [history, setHistory] = useState<QAPair[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<Error | null>(null)

  const askQuestion = useCallback(async (question: string, items: ItemRecord[]) => {
    if (!question.trim() || items.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const answer = await researchItems(question.trim(), items)
      setHistory((prev) => {
        const next = [{ question: question.trim(), answer }, ...prev]
        return next.slice(0, MAX_HISTORY)
      })
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return { history, loading, error, askQuestion, clearHistory }
}
