/**
 * D6 to A6 — the whistle's top octave, where the grips repeat the bottom one and the breath does the
 * work. The one thing a fingering chart cannot teach, so these are written to be played there rather
 * than transposed into it.
 *
 * The recorders reach these notes as written. Both ocarinas stop short, and `bestShift` hands them the
 * whole octave down rather than a smaller move, so they play the same tunes in the register they have.
 * `tests/data.test.ts` pins that, since it is the one section outside the range the rest fits.
 */
import { defineSong, type Song } from '../songUtils'

export const SECOND_OCTAVE: readonly Song[] = [
  defineSong({
    id: 'second-octave-scale',
    title: 'D major scale, second octave',
    subtitle: 'Exercise — up to A6 and back down',
    tags: ['exercise', 'hard'],
    key: 'D',
    spec: 'D6 E6 F#6 G6 | A6 G6 F#6 E6 | D6:4',
  }),

  defineSong({
    id: 'second-octave-arpeggio',
    title: 'D major arpeggio, second octave',
    subtitle: 'Exercise — leaps across the top of the range',
    tags: ['exercise', 'hard'],
    key: 'D',
    spec: 'D6 F#6 A6 F#6 | D6:2 A6:2 | F#6 D6 F#6 A6 | F#6 D6:3',
  }),

  // Each new note against the same home note, which is what makes a top note audibly flat or sharp:
  // the octave below is right there to compare it with.
  defineSong({
    id: 'second-octave-steps',
    title: 'Top notes, one at a time',
    subtitle: 'Exercise — every note answered by D6',
    tags: ['exercise', 'hard'],
    key: 'D',
    spec: 'D6 E6 D6 F#6 | D6 G6 D6 A6 | A6:2 D6:2',
  }),

  defineSong({
    id: 'merrily-we-roll-along',
    title: 'Merrily We Roll Along',
    subtitle: 'Traditional, written up in the second octave — D major',
    tags: ['folk', 'hard'],
    key: 'D',
    spec: `
      F#6 E6 D6 E6 | F#6 F#6 F#6:2 | E6 E6 E6:2 | F#6 A6 A6:2
      F#6 E6 D6 E6 | F#6 F#6 F#6 F#6 | E6 E6 F#6 E6 | D6:4
    `,
  }),
]
