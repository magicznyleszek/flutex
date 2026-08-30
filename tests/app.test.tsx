import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'

import App from '../src/App'
import { DEFAULT_SONG } from '../src/data/songs'
import { theme } from '../src/theme'

/**
 * Smoke test for the whole application.
 *
 * Server-side rendering needs neither jsdom nor extra libraries, and it catches
 * what is easiest to break while assembling UI: a bad Mantine prop, a missing
 * provider, an exception during hook initialisation. The absence of `window` is
 * a feature here — it also proves the localStorage access is guarded.
 */
const render = (): string =>
  renderToStaticMarkup(
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>,
  )

describe('App', () => {
  it('renders without window or localStorage', () => {
    expect(typeof window).toBe('undefined')
    expect(() => render()).not.toThrow()
  })

  it('starts on the first note of the default song', () => {
    const markup = render()
    const firstNote = DEFAULT_SONG.notes[0]?.note

    expect(firstNote).toBeDefined()
    expect(markup).toContain('Flutex')
    expect(markup).toContain(DEFAULT_SONG.title)
    expect(markup).toContain(`>${firstNote}<`)
  })

  it('invites the user to enable the microphone rather than showing it live', () => {
    const markup = render()

    expect(markup).toContain('Enable microphone')
    expect(markup).not.toContain('Stop listening')
  })
})
