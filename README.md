# Flutex

A recorder and tin whistle trainer that runs entirely in the browser. It listens
through the microphone, works out which note you are playing, and waits until
that note is the one on screen before moving on — a *wait-and-proceed* model, so
there is no clock to race and no wrong turn to recover from.

Live at [flutex.zefirefemera.xyz](https://flutex.zefirefemera.xyz).

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
- **Rendering** is throttled deliberately. Detection runs at 60 fps, but only
  structural changes (a new note, a status change, a counter tick) publish
  immediately; the tuner and progress bars are limited to ~30 fps, and silence
  produces no renders at all.

Audio never leaves the machine — there is no backend.

## Stack

| Concern     | Choice                                        |
| ----------- | --------------------------------------------- |
| UI          | React 19                                      |
| Language    | TypeScript, strict, no JavaScript sources     |
| Bundler     | Parcel 2                                      |
| Components  | Mantine 9 with a custom theme                 |
| Icons       | `@phosphor-icons/react`                       |
| Audio       | native Web Audio API                          |
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
  lib/          pitch detection, music theory, the trainer state machine
  data/         instruments, fingering charts, songs, settings
  hooks/        microphone session, trainer wiring, persistence
  components/   presentational components, one CSS module each
  theme.ts      Mantine theme: colours, fonts, radii
tests/          unit tests plus an SSR smoke test of App
```

## Adding a song

Songs live in [src/data/songs.ts](src/data/songs.ts). In a spec string a note is
`D5` for one beat and `D5:2` for two; `|` marks a bar line and is stripped before
the note list reaches the trainer.

```ts
defineSong({
  id: 'my-song',
  title: 'My song',
  tags: ['easy'],
  spec: 'D5 E5 F#5:2 | G5 A5 B5:2',
}),
```

The test suite checks every song against both instruments' ranges, so an
unplayable note fails CI rather than surfacing as a missing fingering diagram.

## A note on the TypeScript version

`typescript` is pinned to `~6.0.3` on purpose. TypeScript 7 is out, but
`ts-jest` declares a peer range of `>=4.3 <7` and `typescript-eslint` requires
`>=4.8.4 <6.1.0`; upgrading breaks both. The pin can go once those two ship
support.
