import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake while `active` is true — both hands are on the instrument, so nothing will
 * tap the phone before it dims. The lock cannot be taken once and kept: browsers drop it whenever the
 * tab is hidden and never hand it back, hence the `visibilitychange` listener and the sentinel ref.
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
          // The effect can be torn down mid-request, and a lock nobody holds a reference to would
          // stay up until the page unloads.
          if (cancelled) {
            void sentinel.release().catch(() => undefined)
            return
          }

          sentinelRef.current = sentinel
          sentinel.addEventListener('release', () => {
            sentinelRef.current = null
          })
        },
        // Refused outside a user gesture, and in battery saver. Neither is worth surfacing: the
        // trainer works, the screen just sleeps as it always did.
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
