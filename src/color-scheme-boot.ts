/**
 * Paints the colour scheme before the app bundle runs. MantineProvider only sets
 * `data-mantine-color-scheme` once React has mounted — several hundred milliseconds of the wrong
 * background — so index.html loads this as a blocking classic script.
 *
 * The device decides, unless the toggle has overridden it earlier in this session. That is
 * `COLOR_SCHEME_KEY` of colorScheme.ts, spelled out again because a classic script cannot import.
 */
const OVERRIDE_KEY = 'flutex-color-scheme'

/** Mantine's own key, where the scheme used to be remembered for good. Left over on older installs. */
const STALE_KEY = 'mantine-color-scheme-value'

function scheme(): string {
  try {
    const override = sessionStorage.getItem(OVERRIDE_KEY)
    if (override === 'light' || override === 'dark') return override
  } catch {
    // Reading storage throws outright when cookies are blocked.
  }

  // The `dark` query rather than `light`, so this and Mantine resolve `auto` the same way.
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * The attribute and nothing else. Mantine's stylesheet already ties `color-scheme` to it, and an
 * inline `style.colorScheme` here would win over that — leaving the scrollbars on the old scheme.
 */
document.documentElement.setAttribute('data-mantine-color-scheme', scheme())

// Nothing reads it any more, and leaving it would keep one evening's choice on disk for good.
try {
  localStorage.removeItem(STALE_KEY)
} catch {
  // Blocked storage, so there was nothing stored to clear either.
}
