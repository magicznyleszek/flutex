# Flutex

Learn tunes on a recorder, tin whistle or ocarina in your browser. Flutex listens
through the microphone, works out which note you played, and waits for the note on
screen before moving on. There is no clock to race and nothing to recover from when
you miss.

Live at [flutex.zefirefemera.xyz](https://flutex.zefirefemera.xyz).

## What it does

- Five instruments: tin whistle in D, soprano recorder in baroque and in German
  fingering, and 6-hole and 12-hole ocarinas. Each has its own fingering chart and
  drawing, and you see the previous, current and next note at once.
- Sixty-five songs: exercises, tunes most people already know, carols, traditional
  dance tunes and airs, and a handful written up in the whistle's second octave, all of
  them out of copyright. You can add one of your own in [either of two
  formats](#writing-your-own-song).
- Hear it plays the melody through the speakers so you know what you are aiming at.
  The microphone is off while it plays.
- A tuner and a hold meter. A note counts once you have held it in tune long enough,
  and the tolerance you pick decides how long that is.
- It works offline after the first visit, installs like an app, and keeps the screen
  awake while you practise.

Audio never leaves your machine. There is no backend and no analytics.

## How it works

**Pitch detection** is the McLeod Pitch Method, a normalised square difference
function over a 2048-sample window. Normalisation reads a prefix sum of squared
samples, so it costs O(1) per lag. It takes the first qualifying peak rather than the
tallest, which is what stops a strong second harmonic from reading an octave low.
Parabolic interpolation on the peak gets it under a cent. A median filter over three
frames drops single-frame outliers, and silence clears the history so a release shows
up at once.

**The trainer** is a pure state machine ([src/lib/trainer.ts](src/lib/trainer.ts)).
Give it a note and how many cents off it was, get a snapshot back. Nothing in it
touches React, the DOM or a clock, so the whole rule set is covered by fast unit
tests.

**Transposition** starts from concert pitch: a song stores its notes as written,
along with the key it was written in. Picking an instrument fits the melody to it
([src/lib/transpose.ts](src/lib/transpose.ts)). The shift that leaves the most notes
playable wins, and a tie goes to a whole octave rather than a smaller move. A melody
that already fits is left exactly as written, and one that has to move keeps its key
where that is possible. A song can also pin a shift by hand through `overrides`,
which is how *Concerning Hobbits* stays in D on the ocarinas. The search mostly earns
its keep on pasted tunes, which arrive in any key and octave.

**Notes the instrument does not have** are played at the nearest note it does, within
a tritone, and the song card names every swap (`F#6 → E6`). Moving the whole melody is
tried first, so this is only what is left over. A note further out than a tritone keeps
its own name and an empty fingering slot, because nothing near enough is worth
offering. The swap goes into the arrangement rather than the drawing, so the chart,
the trainer and Hear it all ask for the same note. Without it, one unreachable note
walled off the rest of the song.

**Rendering** is throttled on purpose. Detection runs at 60fps, but only structural
changes render straight away: a new note, a status change, a counter tick. The tuner
and progress bars are capped near 30fps, and silence renders nothing at all.

**Offline** support comes from a service worker
([src/service-worker.ts](src/service-worker.ts)) that precaches the whole build under
a per-build cache name. Hashed bundles are served from the cache without asking the
network. `index.html` is the one unhashed name, so it is fetched first and falls back
to the cached copy, which is what lets a deploy reach an installed app even when
nothing else changed. The worker is TypeScript too, typechecked on its own against
`tsconfig.worker.json`.

## Stack

| Concern     | Choice                                        |
| ----------- | --------------------------------------------- |
| UI          | React 19                                      |
| Language    | TypeScript, strict, no JavaScript sources     |
| Bundler     | Parcel 2                                      |
| Components  | Mantine 9 with a custom theme                 |
| Icons       | `@phosphor-icons/react`                       |
| Audio       | native Web Audio API                          |
| Offline     | service worker via `@parcel/service-worker`   |
| Tests       | Jest + ts-jest                                |
| Linting     | ESLint (typescript-eslint) and Stylelint      |
| Deployment  | GitHub Actions → GitHub Pages                 |

Every config file is TypeScript or JSON. `eslint.config.ts` is loaded through jiti,
`jest.config.ts` through ts-node.

## Commands

```sh
npm start          # dev server on http://localhost:1234
npm run build      # production build into dist/
npm run verify     # typecheck + eslint + stylelint + jest
npm test           # jest
npm run lint:fix   # eslint --fix
```

CI runs `verify` on every push and pull request, then builds and deploys `main` to
GitHub Pages.

## Layout

```
src/
  lib/          pitch detection, music theory, transposition, ABC, the state machine
  data/         instruments, fingering charts, the custom song, settings
  data/songs/   the library, a file per section and the index that joins them in order
  hooks/        microphone session, trainer wiring, demo playback, persistence
  components/   presentational components, a CSS module each where they need one
  theme.ts      Mantine theme: colours, fonts, radii
  global.css    the two colour schemes as custom properties
  service-worker.ts, manifest.webmanifest, color-scheme-boot.ts
tests/          unit tests plus an SSR smoke test of App
scripts/        abcToSong.ts, which prints a library entry for an ABC tune
```

## Adding a song to the library

The songs live in [src/data/songs/](src/data/songs/) and nothing else does. What a
song *is*, and how one is fitted to an instrument, lives in
[src/data/songUtils.ts](src/data/songUtils.ts). The library imports from it, never
the other way round.

In a spec string, `D5` is a note of one beat and `D5:2` one of two. `|` marks a bar
line and is stripped before the notes reach the trainer. `key` is the key the tune is
written in, which is where transposition aims from.

```ts
defineSong({
  id: 'my-song',
  title: 'My song',
  tags: ['easy'],
  key: 'D',
  spec: 'D5 E5 F#5:2 | G5 A5 B5:2',
}),
```

There is one file per section: `exercises.ts`, `firstTunes.ts`, `carols.ts` and so
on. A song goes in the file for the section it belongs to, and nowhere do you write
the category out. [songs/index.ts](src/data/songs/index.ts) walks the
`SONG_CATEGORIES` list from [songUtils.ts](src/data/songUtils.ts) over those files to
build `SONGS`, stamping each song with its file's category on the way past. That list
is the only place the order of the sections lives, and the song picker groups them in
the same order.

### Staying in range

Almost every song is written inside D5-E6 on the ten notes all five charts have in
common: the D major scale plus C natural, which is what a tin whistle in D and a
6-hole ocarina share. That is why any instrument can play the library as written. A
tune that did not fit was transposed until it did, or left out.

The tests check every song against every instrument, and check that each one plays
*as written*. A song that needs transposing on a whistle is a song to rewrite rather
than a transposer to fix, and so is one that needs a note approximated. Two songs are
exempt by name, each with a test of its own pinning what every instrument makes of it:

- *Concerning Hobbits* was transcribed from the film rather than written to fit. Its
  high section climbs past both ocarinas, which play it in D anyway and lean on their
  top notes up there.
- *A Blast Of Wind* is too wide for any one shift to fit: A4 to E6 is nineteen
  semitones against a window of fourteen. It is also in A, and the whistle is the one
  chart without a G#. So each instrument takes its own shift. The whistle goes up a
  fourth into D, both recorders and the 6-hole ocarina up a minor third into C, and
  the 12-hole ocarina plays it in A as printed, being the only chart that reaches A4.
  Four of the five keep the tune whole. The 6-hole ocarina cannot, and its shift is
  picked to make the loss small: in C it flattens nine notes at the top of the high
  strain, where staying in A would flatten fourteen at the bottom of the low one.

The *Second octave* section is exempt as a section rather than by name, because sitting
above that window is the whole point of it. On a whistle the top octave uses the same
grips as the bottom one and the breath does the work, so those tunes are written where
they are meant to be played instead of being transposed into it. The whistle and both
recorders take them as written; the ocarinas, which stop short of D6, take the lot down
a whole octave and play the same tunes in the register they have. Everything in the
section stays inside D6-A6 so that stays true: any wider and the shift search starts
preferring a smaller move that leaves a note or two behind.

### Where the tunes come from

All of them are public domain, either traditional or printed long enough ago that the
melody is out of copyright: Arbeau's *Orchésographie* (1589), Playford's *English
Dancing Master* (1651), Thompson's country dances (1779), O'Neill's *Music of Ireland*
(1903), Stephen Foster, Weber. Most were read off ABC transcriptions in the
[Nottingham Music Database](https://ifdo.ca/~seymour/nottingham/nottingham.html) or
[abcnotation.com](https://abcnotation.com), then re-encoded here as bare note lists in
a key the charts can reach. Each song's subtitle names where it came from.

### From an ABC tune

The re-encoding is not done by hand. Paste the tune into **My own song** and a
**Copy song definition** button appears under the box. It hands you the block with the
transposition already worked out, plus a line saying whether it would pass the range
test above. Paste that into the file for its section, then fill in the subtitle naming
the source and pick its tags.

For a tune already in a file, the same job with the longer report the app has no room
for: which instrument would struggle, what each would put in place of a note it
cannot finger, whether the id is taken.

```sh
npm run song -- tune.abc     # or: pbpaste | npm run song
```

Both go through [src/data/songDefinition.ts](src/data/songDefinition.ts), which looks
for the *smallest* move that lands every note on those ten. It is rarely the move you
would guess. A tune written an octave low usually wants a fifth: an octave clears the
bottom of the range but pushes the top past both ocarinas, and a fifth also pulls the
tune into the whistle's D.

Repeats are written out rather than marked, because the trainer walks a melody from
one end to the other and has nowhere to put a jump. An `AABB` tune arrives as all four
strains, with first and second endings in their right places. The one thing the tool
will not do is force a fit. A tune that lands outside those ten notes at every shift
is reported instead, and then it wants editing, or an `overrides` entry and an
exemption, or leaving out.

## Writing your own song

Pick **My own song** at the top of the song list and a box appears under it. What you
type stays in this browser (`localStorage`) and nowhere else, and there is room for one
custom song at a time. Both formats below are recognised automatically.

### A note list

The same thing the built-in songs are written in:

```
F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5:2 E5:2
```

- A note is a letter `A`-`G`, then `#` or `b` if it needs one, then the octave
  number: `F#5`, `Bb4`, `D5`. Middle C is `C4`, so a tin whistle's lowest note is
  `D5`.
- `:beats` sets the length. One beat is a quarter note, so `D5:2` is a half note and
  `D5:0.5` an eighth. Without it, a note lasts one beat.
- `|` and line breaks are free. Put them wherever the music reads best.
- No rests. The trainer waits for you, so a silence has nothing to wait for.
- The key is guessed from the first note. It only hints at how to transpose, and a
  melody the instrument can already play is left where it is.

### ABC notation

Paste a whole tune, headers and all. Anything with an information field (`X:`, `T:`,
`K:` and the rest) at the start of a line is read as ABC:

```abc
X:1
T:The Butterfly
M:9/8
L:1/8
K:Edor
~B3 EFE ~B3 dBA | ~B3 EFE AFD DFA |
```

Flutex reads pitches with their accidentals and octave marks, `K:` including modes
(`Edor`, `Am`, `Bb`), `L:` and `M:` for note lengths, accidentals holding to the end
of their bar, broken rhythm (`a>b`), inline key changes (`[K:D]`), and the `T:` title,
which becomes the song's title.

Repeats are played out into the notes they stand for, since the trainer has nowhere to
put a jump. That covers `|: … :|` twice, `::` between two strains, `:|` on its own
back to the top of the tune, and variant endings written either way, `|1 … :|2 …` or
the `[1` the standard prefers. A two-part reel arrives as `AABB` rather than `AB`.
Repeat *counts* are not read: `:|3` plays twice like any other.

Rests, grace notes, decorations (`!trill!`, `~`), chord symbols and lyrics are all
ignored, because a melody trainer has nothing to do with them. Chords collapse to
their top note, ties become two notes, and a tuplet's notes keep their written
lengths. Several voices are read as one line, so an arrangement for two instruments
comes out interleaved. A header wrapped onto a bare second line, which old collections
do instead of continuing the field with `+:`, is recognised as prose and skipped
rather than read as melody and failing on the first letter that is not a note.

In ABC, `C` is middle C, the same `C4` as above, so a whistle tune written from `D` to
`d'` sounds an octave below the whistle. Flutex moves it up for you and says so.

Anything it cannot read becomes an error naming the character and quoting the line it
sits on, shown where the fingerings normally are. Rhythm is never enforced anywhere in
the app: note lengths only feed the beat counts and Hear it.

### Keeping one

Whichever format you pasted, a **Copy song definition** button appears under the box
once the melody parses. It gives you the tune as a library entry, ready to paste into
whichever file under `src/data/songs/` holds its section. See [Adding a song to the
library](#adding-a-song-to-the-library).

## Fingering charts

The charts in [src/data/instruments.ts](src/data/instruments.ts) are transcribed from
published sources, each named in a comment above its chart, and notes the sources
disagree about are left out rather than guessed at. The recorders carry both fingering
systems separately. Baroque and German differ on six notes, and a test pins every one
of them, because a chart that has quietly mixed the two draws a perfectly plausible
diagram for a note that will not sound.

## A note on the TypeScript version

`typescript` is pinned to `~6.0.3` on purpose. TypeScript 7 is out, but `ts-jest`
declares a peer range of `>=4.3 <7` and `typescript-eslint` requires `>=4.8.4
<6.1.0`, so upgrading breaks both. The pin can go once those two ship support.
