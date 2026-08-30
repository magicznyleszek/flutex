import { useCallback, useEffect, useState } from 'react'

/**
 * Values are raw strings, so `isValid` has to narrow whatever is already in storage.
 * The try/catch covers a missing `window` and private mode, where some browsers throw
 * on the read alone.
 */
export function useLocalStorage<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null && isValid(stored) ? stored : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // A failed write is no reason to interrupt practice.
    }
  }, [key, value])

  const update = useCallback((next: T) => setValue(next), [])

  return [value, update]
}
