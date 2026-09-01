import { renderToStaticMarkup } from 'react-dom/server'

import App from '../src/App'
import { DEFAULT_SONG } from '../src/data/songs'
import { Provider } from '../src/Provider'

/**
 * Server rendering needs no jsdom and catches what breaks while assembling UI: a bad Mantine prop, a
 * missing provider, a throw in a hook. With no `window`, it also proves storage is guarded. Through
 * `Provider` rather than a MantineProvider of its own, so this is the configuration that ships.
 */
const render = (): string =>
  renderToStaticMarkup(
    <Provider>
      <App />
    </Provider>,
  )

describe('App', () => {
  it('renders without window or storage', () => {
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

  // The aria-label, not the visible "Start" — which is a substring of "Start over" beside it.
  it('invites the user to start listening rather than showing it live', () => {
    const markup = render()

    expect(markup).toContain('Start listening through the microphone')
    expect(markup).not.toContain('Stop listening through the microphone')
  })

  // Nothing has been played and nothing is sounding, so there is no run and no playback to put back.
  it('holds Start over disabled until there is something to restart', () => {
    expect(render()).toContain('disabled="" aria-label="Start the song over"')
  })
})
