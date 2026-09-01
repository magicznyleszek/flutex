/**
 * Paints the stored colour scheme before the app bundle runs. MantineProvider only sets
 * `data-mantine-color-scheme` once React has mounted — several hundred milliseconds of the wrong
 * background — so index.html loads this as a blocking classic script. The key is Mantine's own.
 */
const STORAGE_KEY = 'mantine-color-scheme-value'
const FALLBACK = 'dark'

function stored(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
    // `auto` follows the system, and Mantine resolves it the same way.
    if (value === 'auto') {
      return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
  } catch {
    // Reading localStorage throws outright when cookies are blocked.
  }
  return FALLBACK
}

/**
 * The attribute and nothing else. Mantine's stylesheet already ties `color-scheme` to it, and an
 * inline `style.colorScheme` here would win over that — leaving the scrollbars on the old scheme.
 */
document.documentElement.setAttribute('data-mantine-color-scheme', stored())
