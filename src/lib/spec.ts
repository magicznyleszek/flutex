/**
 * Writing a melody out as the note list `parseCustomSong` reads: `D5 A5:2 | F#5:0.5`.
 *
 * Shared by `transcribe` and `midi` because the format has two rules easy to get subtly wrong twice over:
 * lengths must be one of `NOTE_VALUES`, and bar lines fall on elapsed *time*, rests included even though this
 * format cannot write them.
 *
 * No Node and no DOM: the browser paths call this unchanged.
 */

/** Same shape as a `SongNote`, redeclared so `lib` does not import from `data`. */
export interface SpecNote {
  note: string
  /** Length in beats, a beat being a quarter note — the song library's unit. */
  beats: number
}

/**
 * The lengths a spec may use, in beats. Doubling any of the first eight lands on another, which is what lets
 * `fitTempo` treat "same fit, twice the beat" as one answer and choose between them.
 */
export const NOTE_VALUES = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8] as const

/** The closest length a spec may use, and how far off it was as a share of itself. */
export function nearestValue(quarters: number): { value: number, error: number } {
  let best: { value: number, error: number } = { value: NOTE_VALUES[0], error: Infinity }

  for (const value of NOTE_VALUES) {
    const error = Math.abs(quarters - value) / value
    if (error < best.error) best = { value, error }
  }

  return best
}

const renderNote = ({ note, beats }: SpecNote): string =>
  beats === 1 ? note : `${note}:${beats}`

/**
 * A note to write, or a silence, and how much of the bar it took. The two lengths differ on purpose:
 * `note.beats` is written and so must be a value the format allows, `beats` is what elapsed. Keeping both
 * lets the bar lines follow the timing rather than the rounding, and a rest has only the second.
 */
export interface SpecRun {
  note: SpecNote | null
  beats: number
}

/**
 * The note list, with a bar line wherever the melody crossed into a new bar. Rests count towards that though
 * they are not written, or the bars would drift earlier with every gap dropped.
 */
export function renderSpec(runs: readonly SpecRun[], beatsPerBar: number): string {
  const tokens: string[] = []
  let elapsed = 0
  let barsWritten = 0

  for (const run of runs) {
    if (run.note !== null) {
      const bars = Math.floor(elapsed / beatsPerBar)
      if (bars > barsWritten) {
        if (tokens.length > 0) tokens.push('|')
        barsWritten = bars
      }
      tokens.push(renderNote(run.note))
    }
    elapsed += run.beats
  }

  return tokens.join(' ')
}
