import { isMantineColorScheme, type MantineColorSchemeManager } from '@mantine/core'

/**
 * Where the toggle's override is kept. `color-scheme-boot.ts` reads the same key before the bundle
 * runs and writes the string out again, being a classic script with no imports available to it.
 */
export const COLOR_SCHEME_KEY = 'flutex-color-scheme'

/**
 * Remembers the chosen scheme for this session and no longer, which is what leaves the device in
 * charge every time the app is opened. Mantine's own manager uses `localStorage`, so one tap on the
 * toggle pinned a scheme for good: open the app in the morning and it was still last night's.
 *
 * A module constant rather than built per render, because `clearColorScheme` is memoised on it.
 * Every call is guarded — touching storage throws outright when cookies are blocked, and while
 * server rendering there is no `sessionStorage` to touch at all.
 */
export const colorSchemeManager: MantineColorSchemeManager = {
  get: (defaultValue) => {
    try {
      const stored = sessionStorage.getItem(COLOR_SCHEME_KEY)
      return isMantineColorScheme(stored) ? stored : defaultValue
    } catch {
      return defaultValue
    }
  },

  set: (value) => {
    try {
      sessionStorage.setItem(COLOR_SCHEME_KEY, value)
    } catch {
      // The scheme lives in React state either way, so the toggle still works for this page.
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(COLOR_SCHEME_KEY)
    } catch {
      // As above: nothing was stored, so there is nothing to undo.
    }
  },

  // `sessionStorage` is per tab, so no other tab can change this one's scheme under it.
  subscribe: () => undefined,
  unsubscribe: () => undefined,
}
