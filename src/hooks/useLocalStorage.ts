import { useCallback, useEffect, useState } from 'react'

/**
 * A setting that survives between sessions.
 *
 * `isValid` is required because a stored value can go stale — a deleted song or
 * a renamed instrument must not blow up the app on startup. localStorage access
 * sits in try/catch: in private mode some browsers throw on the read alone.
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
