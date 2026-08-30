import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'

import { FluteDiagram } from '../src/components/FluteDiagram'
import { INSTRUMENTS, type Instrument } from '../src/data/instruments'
import { theme } from '../src/theme'

const render = (instrument: Instrument, note: string): string =>
  renderToStaticMarkup(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <FluteDiagram instrument={instrument} note={note} />
    </MantineProvider>,
  )

describe('FluteDiagram', () => {
  // The screen-reader labels are the only description of a fingering that does not depend on
  // the CSS, so they are what these assert on. They also read out in the same order as the
  // holes array, which is how a shifted array reaches a player as a wrong finger.
  it('names every hole of a first-register fingering', () => {
    const markup = render(INSTRUMENTS.recorder, 'F5')

    expect(markup).toContain('Thumb: covered')
    expect(markup).toContain('Hole 4: covered')
    expect(markup).toContain('Hole 5: open')
    expect(markup).toContain('Hole 6: covered')
    expect(markup).toContain('Hole 7: covered')
  })

  // No song in the library reaches E6 yet, so this is currently the only thing exercising a
  // half-covered hole at all — the second register is the first data in the app to use one.
  it('draws the pinched thumb as a half-covered hole', () => {
    expect(render(INSTRUMENTS.recorder, 'E6')).toContain('Thumb: half covered')
    expect(render(INSTRUMENTS.recorder_german, 'G#6')).toContain('Thumb: half covered')
  })

  it('names the instrument a fingering belongs to', () => {
    expect(render(INSTRUMENTS.recorder, 'F5')).toContain('on the Baroque recorder')
    expect(render(INSTRUMENTS.recorder_german, 'F5')).toContain('on the German recorder')
  })

  // C7 exists on the baroque chart and deliberately not on the German one, so the German
  // diagram has to fall through to the out-of-range message rather than draw something.
  it('says so when the instrument cannot reach the note', () => {
    expect(render(INSTRUMENTS.recorder_german, 'C7')).toContain('No fingering for C7')
    expect(render(INSTRUMENTS.recorder, 'C7')).not.toContain('No fingering')
  })
})
