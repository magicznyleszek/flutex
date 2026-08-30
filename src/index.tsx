import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css'
import './global.css'

import App from './App'
import { theme } from './theme'

const container = document.getElementById('root')
if (!container) throw new Error('No #root element in the document')

createRoot(container).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)

/**
 * Offline support. `new URL(..., import.meta.url)` is the form Parcel recognises:
 * it builds service-worker.ts as its own bundle and hands the worker a manifest
 * of everything else it produced. See src/service-worker.ts.
 *
 * Only in a real build. Against the dev server the worker would answer from
 * yesterday's cache while hot reload tried to replace the same files, and the
 * `serviceWorker` guard covers the browsers that have none at all.
 *
 * Registration waits for `load` so it competes with nothing: the first visit
 * should paint before it starts filling a cache it cannot use yet.
 *
 * `type: 'module'` is not a preference — Parcel refuses to emit a classic worker
 * that imports anything, and the manifest arrives by import. The alternative is a
 * worker with the file list written out by hand, which goes stale the first time
 * a bundle hash changes. A browser without module worker support rejects the
 * registration, which lands in the `catch` below: no offline cache there, and
 * nothing else different.
 */
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      new URL('service-worker.ts', import.meta.url),
      { type: 'module' },
    ).catch(
      // A failed registration costs the app nothing but its offline cache, so it
      // is reported rather than thrown — the trainer itself is already running.
      (error: unknown) => { console.error('Offline cache unavailable:', error) },
    )
  })
}
