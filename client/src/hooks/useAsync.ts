import { useCallback, useEffect, useState, type DependencyList } from 'react'

export function useAsync<ResultType, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<ResultType>,
  deps: DependencyList = [],
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [value, setValue] = useState<ResultType | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (...args: Args) => {
    setStatus('pending')
    setError(null)
    try {
      const result = await asyncFn(...args)
      setValue(result)
      setStatus('success')
      return result
    } catch (err) {
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }, deps)

  useEffect(() => {
    if (immediate) {
  execute(...([] as unknown as Args))
    }
  }, [execute, immediate])

  return {
    execute,
    status,
    value,
    error,
    loading: status === 'pending'
  }
}
