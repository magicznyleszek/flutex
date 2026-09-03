/**
 * Two tunes read off the mp3s in `samples/` with `npm run song:audio`, then tidied by hand.
 *
 * Both needed an ffmpeg band-pass first, which no flag of the tool's does — on a finished mix it is the
 * difference between a line and nothing. Neither file holds a pitch in half its own frames, so each entry is
 * one readable stretch rather than the piece.
 *
 * Two edits are judgement rather than transcription. Off-scale readings snap to the seven-note scale holding
 * most of the reading, the detector erring flat and a chiptune's semitone ornaments fitting ten diatonic
 * notes no better either way. And every bar line and note value is hand-set: the tool's fitted tempo ranged
 * from 40 to 240 BPM across windows of these files.
 */
import { defineSong, type Song } from '../songUtils'

export const FROM_RECORDINGS: readonly Song[] = [
  /*
   * The low ostinato only, filtered to 380-680 Hz. Its lead sits an octave and a half above, putting the pair
   * nineteen semitones apart against a window of fourteen.
   *
   * D# minor on the recording. Two shifts land those seven notes on this chart's ten, +1 and +8, and only +8
   * also fits the range — hence B minor. The last B5 is the loop turn-over held once, not an ending the
   * recording has.
   */
  defineSong({
    id: 'desert-planet-red-dwarf',
    title: 'Desert Planet — Red Dwarf',
    subtitle: 'Transcribed from a recording, the ostinato and its answer — B minor',
    tags: ['synth', 'medium'],
    key: 'B',
    spec: `
      E5:0.5 F#5:0.5 E5:2 G5:0.5 F#5:0.5 | G5:0.5 B5:0.5 A5:0.5 B5:2 E5:0.5
      F#5:0.5 G5:1.5 F#5:0.5 G5:0.5 F#5:0.5 A5:0.5 | B5:2 E5:0.5 D5:0.5 F#5
      E5 D5:2 B5:0.5 E5:0.5 | D5:0.5 E5:0.5 F#5:0.5 G5:1.5 F#5:0.5 G5:0.5
      F#5:0.5 A5:0.5 B5:2 E5:0.5 D5:0.5 | F#5:2 G5 A5
      E5:0.5 F#5:0.5 E5:2 G5:0.5 F#5:0.5 | G5:0.5 B5:0.5 A5:0.5 B5:2
    `,
  }),

  /*
   * Pads over an E2 drone, so `song:audio` on its own settings finds the drone, reads 26% voiced and refuses
   * to print. The exception is 1:00-1:45, where a lead sits above the pads and reads at 42% voiced through
   * 650-1900 Hz — E minor, already inside the window, so no shift at all.
   *
   * Slow on purpose: the loudness envelope puts it near 109 BPM, and the long notes are the character.
   */
  defineSong({
    id: 'mountain-realm-atop-the-tower',
    title: 'Mountain Realm — Atop the Tower',
    subtitle: 'Transcribed from a recording, the one section with a lead — E minor',
    tags: ['synth', 'easy'],
    key: 'E',
    spec: `
      E5 F#5 E5:0.5 A5:0.5 B5 | C6 D6 B5:2
      A5 C6 A5:0.5 C6:0.5 B5 | A5:0.5 G5:0.5 B5 D6:0.5 C6:0.5 B5
      G5:0.5 A5:0.5 B5:0.5 C6:0.5 B5 A5 | B5:0.5 A5:0.5 F#5 E5:2
      A5:0.5 B5:0.5 C6:1.5 B5:1.5 | G5 B5:0.5 C6:0.5 B5 A5 | F#5 E5:3
    `,
  }),
]
