# Flutex

A recorder, tin whistle and ocarina trainer that runs entirely in the browser. It
listens through the microphone, works out which note you are playing, and waits
until that note is the one on screen before moving on — a *wait-and-proceed*
model, so there is no clock to race and no wrong turn to recover from.

Live at [flutex.zefirefemera.xyz](https://flutex.zefirefemera.xyz).

## What it does

- **Five instruments** — tin whistle in D, soprano recorder in baroque and in
  German fingering, and 6-hole and 12-hole ocarinas. Each has its own fingering
  chart and its own drawing, and the previous, current and next note are all
  shown at once.
- **Thirty-one songs** — two exercises, tunes most people already know, carols, and
  traditional dance tunes and airs, all of them out of copyright — plus one song
  you write yourself in [either of two formats](#writing-your-own-song).
- **Hear it** plays the melody through the speakers with an oscillator, so you
  can check what you are aiming at. The microphone stays off while it runs.
- **A tuner** and a hold meter: the note counts once you have held it in tune for
  long enough, and how long that is depends on the tolerance you pick.
- **Offline** after the first visit, installable, and it holds a screen wake lock
  while you practise so the phone does not go dark between notes.

Audio never leaves the machine — there is no backend, and no analytics.

## How it works

- **Pitch detection** — the McLeod Pitch Method (a normalised square difference
  function) over a 2048-sample window. The NSDF normalisation uses a prefix sum
  of squared samples, so it costs O(1) per lag, and the *first* qualifying peak
  is picked rather than the highest, which is what keeps a strong second
  harmonic from reading an octave off. Parabolic interpolation on the peak gives
  sub-cent resolution; a median filter of three frames removes single-frame
  outliers, and silence clears the history so a release registers immediately.
- **The trainer** is a pure state machine ([src/lib/trainer.ts](src/lib/trainer.ts)).
  It takes a note plus a deviation in cents and returns a snapshot. Nothing in
  it touches React, the DOM or a clock, which is why the whole rule set is
  covered by fast unit tests.
- **Transposition** — songs are stored at concert pitch with the key they were
  written in. Choosing an instrument fits the melody to it
  ([src/lib/transpose.ts](src/lib/transpose.ts)): the shift that leaves the most
  notes playable wins, and ties go to a whole octave before a smaller move — so a
  melody that already fits is left exactly as written, and one that has to move
  keeps the key it was written in wherever that is possible. A song can also pin
  a shift for one instrument by hand through `overrides`, which *Concerning
  Hobbits* uses to stay in D on the ocarinas instead of changing key to buy notes
  they still could not all reach. The search itself is mostly for the pasted
  tunes, which arrive in any key and octave.
- **Notes the instrument does not have** are played at the nearest note it does,
  within a tritone, and the song card names every swap — `F#6 → E6`. Moving the
  melody is tried first and this is what is left over; a note further out than
  that keeps its own name and an empty fingering slot, since there is nothing
  near enough to be worth offering. The swap goes into the arrangement rather
  than into the drawing, so the chart, the trainer and **Hear it** agree on what
  you are being asked to play — without it an unreachable note was a wall the
  song could not be got past.
- **Rendering** is throttled deliberately. Detection runs at 60 fps, but only
  structural changes (a new note, a status change, a counter tick) publish
  immediately; the tuner and progress bars are limited to ~30 fps, and silence
  produces no renders at all.
- **Offline** through a service worker ([src/service-worker.ts](src/service-worker.ts))
  that precaches the whole build under a per-build cache name. Hashed bundles are
  served from the cache without asking the network; `index.html`, the one unhashed
  name, is fetched first and falls back to the cached copy, which is what makes a
  deploy that changes nothing else still reach an installed app. The worker is
  TypeScript too, typechecked separately against the worker lib in
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

Every config file is TypeScript or JSON: `eslint.config.ts` is loaded through
jiti, `jest.config.ts` through ts-node.

## Commands

```sh
npm start          # dev server on http://localhost:1234
npm run build      # production build into dist/
npm run verify     # typecheck + eslint + stylelint + jest
npm test           # jest
npm run lint:fix   # eslint --fix
```

CI runs `verify` on every push and pull request, then builds and deploys `main`
to GitHub Pages.

## Layout

```
src/
  lib/          pitch detection, music theory, transposition, ABC, the state machine
  data/         instruments, fingering charts, the song library, the custom song, settings
  hooks/        microphone session, trainer wiring, demo playback, persistence
  components/   presentational components, a CSS module each where they need one
  theme.ts      Mantine theme: colours, fonts, radii
  global.css    the two colour schemes as custom properties
  service-worker.ts, manifest.webmanifest, color-scheme-boot.ts
tests/          unit tests plus an SSR smoke test of App
scripts/        abcToSong.ts, which prints a library entry for an ABC tune
```

## Adding a song to the library

The songs are in [src/data/songs.ts](src/data/songs.ts) and nothing else is: what
a song *is*, and how one is fitted to an instrument, lives in
[src/data/songUtils.ts](src/data/songUtils.ts), which the library imports and
never the other way round. In a spec string a note is `D5` for one beat and
`D5:2` for two; `|` marks a bar line and is stripped before the note list reaches
the trainer. `key` is the key it is written in, which is what transposition aims
from.

```ts
defineSong({
  id: 'my-song',
  title: 'My song',
  tags: ['easy'],
  key: 'D',
  spec: 'D5 E5 F#5:2 | G5 A5 B5:2',
}),
```

The test suite checks every song against every instrument, and also checks that
each one plays *as written* — a song that needs transposing on a whistle is a
song to rewrite, not a transposer to fix, and a song that needs a note
approximated is one too. Two songs are exempt by name, each with a test of its
own pinning what every instrument makes of it:

- *Concerning Hobbits* is transcribed from the film rather than written to fit,
  and its high section climbs past both ocarinas, which play it in D anyway and
  lean on their top notes up there.
- *A Blast Of Wind* is too wide for any shift to fit — A4 to E6, nineteen
  semitones against a window of fourteen — and it is in A, whose G# the whistle is
  the one chart to lack. So each instrument takes its own shift: the whistle a
  fourth up into D, both recorders and the 6-hole ocarina a minor third up into C,
  and the 12-hole ocarina in A as printed, being the only chart that reaches A4.

Squeezing that one into the shared range would cost a strain either way — up, and
its top notes push past both ocarinas; down, and most of it falls below D5 — so
letting each chart find its own key keeps the tune whole on four of the five. The
6-hole ocarina is the exception, and its shift is chosen to make the loss small
rather than to avoid it: in C it flattens the top of the high strain, nine notes of
a hundred and twenty, where staying in A would flatten the bottom of the low one
and cost fourteen.

Apart from those two the test passes by construction rather than by luck: every
song is written inside D5–E6 on the ten notes all five charts have in common — the
D major scale plus C natural, which is what a tin whistle in D and a 6-hole
ocarina share — so a tune that did not fit was transposed until it did, or left
out.

The tunes are public domain: traditional, or printed long enough ago that the
melody is out of copyright — Arbeau's *Orchésographie* (1589), Playford's *English
Dancing Master* (1651), Thompson's country dances (1779), O'Neill's *Music of
Ireland* (1903), Stephen Foster, Weber. Most were read off ABC transcriptions in
the [Nottingham Music
Database](https://ifdo.ca/~seymour/nottingham/nottingham.html) or
[abcnotation.com](https://abcnotation.com), and re-encoded here as bare note lists
in a key the charts can reach; each song's subtitle names where it came from.

### From an ABC tune

That re-encoding is not done by hand. Paste the tune into **My own song** and a
**Copy song definition** button appears under the box, giving you the block with
the transposition already worked out, plus a line saying whether it would pass the
test above. Fill in the subtitle, which names the source, and pick its tags.

The same for a tune in a file, with the longer report the app has no room for —
which instrument would struggle, what each would put in place of a note it cannot
finger, whether the id is already taken:

```sh
npm run song -- tune.abc     # or: pbpaste | npm run song
```

Both go through [src/data/songDefinition.ts](src/data/songDefinition.ts), which
searches for the *smallest* move landing every note on those ten. It is rarely the
move you would guess: a tune written an octave low usually wants a fifth rather
than an octave, because an octave clears the bottom of the range but pushes the
top past both ocarinas — and that also pulls the tune into the whistle's D.

Repeats are written out rather than marked, because the trainer walks a melody from
one end to the other and has nowhere to put a jump: an `AABB` tune arrives as all
four strains, first and second endings in their right places. The one thing the
tool will not do for you is force a fit — a tune that lands outside those
ten notes at every shift is reported instead, and it needs editing, an `overrides`
entry and an exemption, or leaving out.

## Writing your own song

Pick **My own song** at the top of the song list and a box appears under it. What
you type is kept in this browser (`localStorage`) and nowhere else, and there is
room for one custom song at a time. Two formats are accepted, told apart
automatically.

### A note list

The same thing the built-in songs are written in:

```
F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5:2 E5:2
```

- A note is a letter `A`–`G`, then `#` or `b` if it needs one, then the octave
  number: `F#5`, `Bb4`, `D5`. Middle C is `C4`, so a tin whistle's lowest note is
  `D5`.
- `:beats` sets the length. One beat is a quarter note, so `D5:2` is a half note
  and `D5:0.5` an eighth. Without it a note lasts one beat.
- `|` and line breaks are free — put them wherever the music reads best.
- No rests. The trainer waits for you, so a silence has nothing to wait for.
- The key is guessed from the first note. It is only a hint for transposing: a
  melody the instrument can already play is left exactly where it is.

### ABC notation

Paste a whole tune, headers and all — anything with an information field
(`X:`, `T:`, `K:` …) at the start of a line is read as ABC:

```abc
X:1
T:The Butterfly
M:9/8
L:1/8
K:Edor
~B3 EFE ~B3 dBA | ~B3 EFE AFD DFA |
```

Read: pitches with their accidentals and octave marks, `K:` including modes
(`Edor`, `Am`, `Bb`), `L:` and `M:` for note lengths, accidentals holding to the
end of their bar, broken rhythm (`a>b`), inline key changes (`[K:D]`), and the
`T:` title, which becomes the song's title.

Repeats are played out into the notes they stand for, since the trainer has
nowhere to put a jump. `|: … :|` twice, `::` between two strains, `:|` on its own
back to the top of the tune, and variant endings either way round — `|1 … :|2 …`
or the `[1` the standard prefers — so a two-part reel arrives as `AABB` rather
than `AB`. What is not read is a repeat *count*: `:|3` plays twice like any other.

Ignored, because a melody trainer has nothing to do with them: rests, grace
notes, decorations (`!trill!`, `~`), chord symbols and lyrics. Chords collapse to
their top note, ties become two notes, and a tuplet's notes keep their written
lengths. Several voices are read as one line, so an arrangement for two
instruments comes out interleaved. A header wrapped onto a bare second line — old
collections do that instead of continuing the field with `+:` — is recognised as
prose and skipped, rather than read as melody and failing on the first letter that
is not a note.

In ABC, `C` is middle C — the same `C4` as above — so a whistle tune written from
`D` to `d'` sounds an octave below the whistle. Flutex moves it up for you and
says so.

Anything it cannot read is an error naming the character, shown where the
fingerings normally are. Rhythm is never enforced anywhere in the app: note
lengths only feed the beat counts and **Hear it**.

### Keeping one

Whichever format you pasted, a **Copy song definition** button appears under the
box once the melody parses. It gives you the tune as a library entry, ready to
paste into `songs.ts` — see [Adding a song to the
library](#adding-a-song-to-the-library).

## Fingering charts

The charts in [src/data/instruments.ts](src/data/instruments.ts) are transcribed
from published sources, with the source named in a comment above each one, and
the notes the sources disagree about are left out rather than guessed at. The
recorders carry both fingering systems separately — baroque and German differ on
six notes, and a test pins every one of them, because a chart that has quietly
mixed the two draws a perfectly plausible diagram for a note that will not sound.

## A note on the TypeScript version

`typescript` is pinned to `~6.0.3` on purpose. TypeScript 7 is out, but
`ts-jest` declares a peer range of `>=4.3 <7` and `typescript-eslint` requires
`>=4.8.4 <6.1.0`; upgrading breaks both. The pin can go once those two ship
support.
