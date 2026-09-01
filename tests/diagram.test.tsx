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
  // The screen-reader labels are the only description of a fingering that does not depend on CSS, and
  // they read out in the holes array's order — which is how a shifted array becomes a wrong finger.
  it('names every hole of a first-register fingering', () => {
    const markup = render(INSTRUMENTS.recorder, 'F5')

    expect(markup).toContain('Thumb: covered')
    expect(markup).toContain('Hole 4: covered')
    expect(markup).toContain('Hole 5: open')
    expect(markup).toContain('Hole 6: covered')
    expect(markup).toContain('Hole 7: covered')
  })

  // No song reaches E6 yet, so this is the only thing exercising a half-covered hole on a tube.
  it('draws the pinched thumb as a half-covered hole', () => {
    expect(render(INSTRUMENTS.recorder, 'E6')).toContain('Thumb: half covered')
    expect(render(INSTRUMENTS.recorder_german, 'G#6')).toContain('Thumb: half covered')
  })

  it('names the instrument a fingering belongs to', () => {
    expect(render(INSTRUMENTS.recorder, 'F5')).toContain('on the Baroque recorder')
    expect(render(INSTRUMENTS.recorder_german, 'F5')).toContain('on the German recorder')
  })

  // C7 is on the baroque chart and deliberately not on the German one, so the German diagram has to
  // fall through to the out-of-range message rather than draw something.
  it('says so when the instrument cannot reach the note', () => {
    expect(render(INSTRUMENTS.recorder_german, 'C7')).toContain('No fingering for C7')
    expect(render(INSTRUMENTS.recorder, 'C7')).not.toContain('No fingering')
  })

  // An ocarina takes the other branch: an SVG of the body with the holes in their places, named by
  // finger. C5 is the one fingering where both subholes are open and nothing else is.
  it('names the holes of an ocarina by finger', () => {
    const markup = render(INSTRUMENTS.ocarina_12, 'C5')

    expect(markup).toContain('Left index: covered')
    expect(markup).toContain('Left subhole: open')
    expect(markup).toContain('Right subhole: open')
    expect(markup).toContain('Left thumb, on the back: covered')
  })

  // On an SVG a half cover is a drawn shape rather than a CSS gradient.
  it('draws a half-covered ocarina hole as its own arc', () => {
    const markup = render(INSTRUMENTS.ocarina_6, 'C#5')

    expect(markup).toContain('Front upper right: half covered')
    expect(markup).toContain('<path')
  })
})
