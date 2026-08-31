import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake while `active` is true, so a phone propped up in front of you does
 * not dim halfway through a tune — both your hands are on the instrument, and the trainer is
 * useless the moment the display sleeps.
 *
 * The lock is not something you take once and keep. Browsers drop it whenever the tab stops
 * being visible and never hand it back on their own, so this listens for the tab coming
 * forward again and re-takes it. That is also why the sentinel lives in a ref: it outlives
 * the render that asked for it.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    // Firefox ships no Wake Lock API at all, while the DOM typings declare `wakeLock` as
    // always present — hence reading it back through `Partial` to get an honest `undefined`.
    const api: WakeLock | undefined = (navigator as Partial<Navigator>).wakeLock
    if (api === undefined) return

    let cancelled = false

    const release = (): void => {
      const held = sentinelRef.current
      sentinelRef.current = null
      // A sentinel the browser already released rejects here, which is ordinary, not a fault.
      if (held !== null && !held.released) void held.release().catch(() => undefined)
    }

    const acquire = (): void => {
      if (cancelled || sentinelRef.current !== null) return
      // Requesting while hidden always fails, so save the round trip.
      if (document.visibilityState !== 'visible') return

      void api.request('screen').then(
        (sentinel) => {
          // The effect can be torn down while the request is still in flight, and a lock
          // nobody is holding a reference to would stay up until the page unloads.
          if (cancelled) {
            void sentinel.release().catch(() => undefined)
            return
          }

          sentinelRef.current = sentinel
          sentinel.addEventListener('release', () => {
            sentinelRef.current = null
          })
        },
        // Refused outside a user gesture, and refused on a device in battery saver. Neither
        // is worth surfacing: the trainer works, the screen just sleeps as it always did.
        () => undefined,
      )
    }

    if (!active) {
      release()
      return
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      release()
    }
  }, [active])
}
