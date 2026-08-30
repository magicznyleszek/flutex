/**
 * Paints the stored colour scheme before the app bundle runs.
 *
 * MantineProvider sets `data-mantine-color-scheme` once React has mounted, which for a
 * ~460kB bundle is several hundred milliseconds of the wrong background for anyone who
 * chose light. index.html loads this as a blocking classic script, so the attribute is
 * already there when the first paint happens.
 *
 * The key is the one Mantine's default localStorage manager writes, so this and the
 * provider cannot disagree. Reading localStorage throws outright when cookies are blocked,
 * hence the catch.
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
    // No storage access, so the default is all there is.
  }
  return FALLBACK
}

/**
 * Only the attribute. Mantine's stylesheet declares `color-scheme:
 * var(--mantine-color-scheme)` on `:root` and flips that variable off this attribute, so
 * scrollbars and native controls follow along on their own. Setting `style.colorScheme`
 * here as well would look like belt and braces and instead pin it: an inline style beats
 * that rule, so the toggle would repaint the app and leave the scrollbars behind.
 */
document.documentElement.setAttribute('data-mantine-color-scheme', stored())
