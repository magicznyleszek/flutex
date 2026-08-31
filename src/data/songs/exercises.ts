/**
 * Not tunes: the scale and the arpeggio the rest of the library is written on, for finding where the
 * notes are before there is a melody to shape.
 *
 * A new entry belongs inside the shared note set `index.ts` describes, and this file's order is the
 * order the song list shows.
 */
import { defineSong, type Song } from '../songUtils'

export const EXERCISES: readonly Song[] = [
  defineSong({
    id: 'd-major-scale',
    title: 'D major scale',
    subtitle: 'Exercise — up and down',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 E5 F#5 G5 A5 B5 C#6 D6 | C#6 B5 A5 G5 F#5 E5 D5:2',
  }),

  defineSong({
    id: 'd-major-arpeggio',
    title: 'D major arpeggio',
    subtitle: 'Exercise — interval leaps',
    tags: ['exercise', 'easy'],
    key: 'D',
    spec: 'D5 F#5 A5 D6 | A5 F#5 D5:2 | D5 A5 F#5 D6 | A5 F#5 D5:2',
  }),
]
