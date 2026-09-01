import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css'
import './global.css'

import App from './App'
import { Provider } from './Provider'

const container = document.getElementById('root')
if (!container) throw new Error('No #root element in the document')

createRoot(container).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
)

/**
 * Production only: against the dev server the worker answers from a stale cache while hot reload
 * replaces the same files. `new URL(..., import.meta.url)` with `type: 'module'` is the only form
 * Parcel bundles — the manifest reaches service-worker.ts by import, and a classic worker cannot.
 */
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      new URL('service-worker.ts', import.meta.url),
      { type: 'module' },
    ).catch(
      (error: unknown) => { console.error('Offline cache unavailable:', error) },
    )
  })
}
