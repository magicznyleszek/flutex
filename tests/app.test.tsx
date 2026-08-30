import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'

import App from '../src/App'
import { DEFAULT_SONG } from '../src/data/songs'
import { theme } from '../src/theme'

/**
 * Server-side rendering needs no jsdom and catches what breaks while assembling UI: a
 * bad Mantine prop, a missing provider, a throw during hook init. There is no `window`
 * here, so it also proves the localStorage access is guarded.
 */
const render = (): string =>
  renderToStaticMarkup(
    <MantineProvider theme={theme} defaultColorScheme="dark">
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
