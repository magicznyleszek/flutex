/**
 * Tunes from games, the hardest thing in the library to bring here. Chip music is written for a synthesiser
 * with no fingers: chromatic where a whistle is diatonic, leaping two octaves inside a bar, one channel
 * carrying the lead and then dropping to a bass fill. Against `SHARED_NOTES` — ten notes, a fourteen-semitone
 * window — most of a soundtrack does not fit.
 *
 * So each of these is a *section*, named in its subtitle, chosen because it fits, and moved by the semitones
 * the subtitle gives. Nothing is approximated or exempted: they clear the same range tests as every other
 * song. Each started as `npm run song:midi -- samples/<file>`, then had its bar layout and note values edited
 * by hand, a sequencer's timing being not a reading a player can follow.
 *
 * Unlike the rest of the library these are not traditional and not out of copyright. They are here as
 * practice material for one person's own instrument, which is the whole scope of this app.
 */
import { defineSong, type Song } from '../songUtils'

export const GAME_THEMES: readonly Song[] = [
  /*
   * The march everyone means by "the Contra theme", eight bars of it with the fill that leads in. This
   * section is in F mixolydian, and a major sixth up that is D mixolydian — the D major scale with a C
   * natural, which is exactly the ten notes every chart shares.
   *
   * Nothing either side of it fits: the vamp before wants a G#, the riff after drops to a low C, and the A
   * natural in the hook rules out the one shift that would have taken the vamp.
   *
   * Each bar is three-three-one-one eighths and then a beat of silence. A spec has no rest, so that beat goes
   * onto the note before it — the hook reads as a held note rather than a gap.
   */
  defineSong({
    id: 'contra-jungle-theme',
    title: 'Contra — Jungle Theme',
    subtitle: 'Contra, NES 1987 — the Stage 1 march, up a major sixth into D',
    tags: ['game', 'medium'],
    key: 'D',
    spec: `
      E5 E5:0.25 F#5:0.5 G5:0.25 B5 A5
      G5:1.5 G5:1.5 G5:0.5 F#5:0.5 | E5:1.5 E5:1.5 E5:0.5 F#5:0.5
      G5:1.5 G5:1.5 G5:0.5 F#5:0.5 | E5:1.5 E5:0.5 A5:0.5 B5:0.25 A5:0.5 F#5:0.75
      B5:1.5 B5:1.5 B5:0.5 A5:0.5 | G5:1.5 G5:1.5 G5:0.5 A5:0.5
      B5:1.5 B5:1.5 B5:0.5 C6:0.5 | D6:1.5 D6:2.5
    `,
  }),

  /*
   * Stage 5's hook, and why only a section of a chip tune can come here: the stage opens on a chromatic
   * wiggle — A#4 A4 C5 A#4 C5 C#5 over and over — that no transposition puts on ten diatonic notes. The
   * melody proper is plainly diatonic, and one semitone up lands all of it: C#5 D#5 F#5 G#5 A#5 B5 C#6 D#6
   * becomes D5 E5 G5 A5 B5 C6 D6 E6, almost exactly this chart's window.
   *
   * All of that section is here: run, phrase, riff twice, and the whole thing again, which is how the loop
   * plays it before falling back to the wiggle. The closing E5 is the one note not in the file — the loop has
   * no ending, and the riff it ends on leaves the tune hanging on its seventh.
   *
   * Written in eighths where the game plays sixteenths. The original runs seven notes a second at 110 BPM and
   * **Hear it** plays a quarter to the second, so doubling the values is what puts it at a speed fingers can
   * follow — the same tune half as fast.
   */
  defineSong({
    id: 'contra-snowfield',
    title: 'Contra — Snowfield',
    subtitle: 'Contra, NES 1987 — the Stage 5 hook, up a semitone into E',
    tags: ['game', 'hard'],
    key: 'E',
    spec: `
      B5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 A5:0.5 D5:0.5
      E5:0.5 E5:0.5 B5:0.5 C6:0.5 B5:0.5 D6:0.5 C6:0.5 D6:0.5 D5:0.5 | E5:3
      G5:0.5 B5:0.5 E6:0.5 D6:0.5 | G5:0.5 B5:0.5 E6:0.5 D6:0.5
      B5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 A5:0.5 D5:0.5
      E5:0.5 E5:0.5 B5:0.5 C6:0.5 B5:0.5 D6:0.5 C6:0.5 D6:0.5 D5:0.5 | E5:3
      G5:0.5 B5:0.5 E6:0.5 D6:0.5 | G5:0.5 B5:0.5 E6:0.5 D6:0.5 | E5:4
    `,
  }),

  /*
   * The second strain, which needs no moving: E, F#, A, B, C#, D, E is already inside the window. The famous
   * opening strain cannot come — it sits on a G natural against an E major tune, a blue note no key here has,
   * and its bass answers the melody an octave and a half below in the same channel.
   *
   * The dotted eighths are the tune's swing, not rounding — play them even and it stops sounding like itself.
   */
  defineSong({
    id: 'advance-wars-nells-theme',
    title: "Advance Wars — Nell's Theme",
    subtitle: 'Advance Wars, GBA 2001 — the second strain, at written pitch in E',
    tags: ['game', 'medium'],
    key: 'E',
    spec: `
      A5:0.75 F#5:0.75 E5:0.25 F#5:0.25 A5 C#6
      A5:0.5 F#5:0.5 C#6:0.5 A5:0.5 F#5:0.5 C#6:0.5 A5:0.25 F#5:0.25 E5:0.5
      B5 A5 A5:2 | E6 D6:0.5 B5:0.5 A5:0.5 B5:1.5
      E5 E5:0.25 F#5:0.25 A5:0.5 E5:0.25 F#5:0.25 A5:0.5 B5:0.25 C#6:0.25 A5:0.5
      B5:0.5 C#6:0.5 E6:3
    `,
  }),
]
