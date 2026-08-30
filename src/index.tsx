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
