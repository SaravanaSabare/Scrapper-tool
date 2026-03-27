import { useEffect, useState } from 'react'
import { fetchHealth, type HealthData } from '../services/api/health.ts'

export function useHealth() {
  const [health, setHealth] = useState<HealthData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((data) => { if (!cancelled) setHealth(data) })
      .catch(() => { /* server offline — keep null */ })
    return () => { cancelled = true }
  }, [])

  return health
}
