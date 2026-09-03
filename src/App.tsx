import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  ArrowCounterClockwiseIcon,
  ArrowsInIcon,
  ArrowsOutIcon,
  CheckCircleIcon,
  MusicNoteIcon,
  PlayIcon,
  StopIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { type JSX, useCallback, useEffect, useMemo, useRef } from 'react'

import { ColorSchemeToggle } from './components/ColorSchemeToggle'
import { Logo } from './components/Logo'
import { MicButton } from './components/MicButton'
import { NoteSequence } from './components/NoteSequence'
import { ProgressBars } from './components/ProgressBars'
import { SettingsBar } from './components/SettingsBar'
import { SongPicker } from './components/SongPicker'
import { Tuner } from './components/Tuner'
import { EMPTY_CUSTOM_SONG, parseCustomSong } from './data/customSong'
import {
  DEFAULT_INSTRUMENT_ID,
  INSTRUMENTS,
  instrumentFreqRange,
  isInstrumentId,
  type InstrumentId,
} from './data/instruments'
import {
  DEFAULT_DIFFICULTY_ID,
  DEFAULT_PENALTY_MODE,
  DIFFICULTIES,
  isDifficultyId,
  isPenaltyMode,
  type DifficultyId,
} from './data/settings'
import { DEFAULT_SONG_ID, getSong, isSongId } from './data/songs'
import { CUSTOM_SONG_ID, songForInstrument, songNoteNames } from './data/songUtils'
import { useFullscreen } from './hooks/useFullscreen'
import { useLocalStorage } from './hooks/useLocalStorage'
import { usePitchDetection } from './hooks/usePitchDetection'
import { useSongDemo } from './hooks/useSongDemo'
import { useSongProgress } from './hooks/useSongProgress'
import { useSongTrainer } from './hooks/useSongTrainer'
import { useWakeLock } from './hooks/useWakeLock'
import { noteWindow, type PenaltyMode } from './lib/trainer'

/** Renaming the `fluteTrainer_*` keys drops settings users have already saved. */
const STORAGE_KEYS = {
  instrument: 'fluteTrainer_instrument',
  difficulty: 'fluteTrainer_difficulty',
  penalty: 'fluteTrainer_penalty',
  song: 'flutex_song',
  customSong: 'flutex_customSong',
} as const

/** Any text at all is worth keeping: half-typed melodies have to survive a reload too. */
const anyText = (value: string): value is string => typeof value === 'string'

export default function App(): JSX.Element {
  const [instrumentId, setInstrumentId] = useLocalStorage<InstrumentId>(
    STORAGE_KEYS.instrument,
    DEFAULT_INSTRUMENT_ID,
    isInstrumentId,
  )
  const [difficultyId, setDifficultyId] = useLocalStorage<DifficultyId>(
    STORAGE_KEYS.difficulty,
    DEFAULT_DIFFICULTY_ID,
    isDifficultyId,
  )
  const [penaltyMode, setPenaltyMode] = useLocalStorage<PenaltyMode>(
    STORAGE_KEYS.penalty,
    DEFAULT_PENALTY_MODE,
    isPenaltyMode,
  )
  const [songId, setSongId] = useLocalStorage<string>(
    STORAGE_KEYS.song,
    DEFAULT_SONG_ID,
    isSongId,
  )

  const [customText, setCustomText] = useLocalStorage<string>(
    STORAGE_KEYS.customSong,
    '',
    anyText,
  )

  const instrument = INSTRUMENTS[instrumentId]

  // Only parsed while the custom song is selected, so half-typed text in the box costs nothing.
  const custom = useMemo(
    () => (songId === CUSTOM_SONG_ID ? parseCustomSong(customText) : null),
    [songId, customText],
  )
  const librarySong = useMemo(() => getSong(songId), [songId])
  // Always a song, even when the text is nonsense: an empty one, whose lack of notes suppresses the trainer.
  const song = custom === null ? librarySong : custom.ok ? custom.song : EMPTY_CUSTOM_SONG
  const songError = custom !== null && !custom.ok ? custom.error : null

  // Everything downstream plays the arrangement, not the song: library notes are at concert pitch, and an
  // instrument that cannot reach them gets the melody moved.
  const arrangement = useMemo(() => songForInstrument(song, instrument), [song, instrument])
  const notes = useMemo(() => songNoteNames(arrangement), [arrangement])
  const range = useMemo(() => instrumentFreqRange(instrument), [instrument])

  const toleranceCents = DIFFICULTIES[difficultyId].toleranceCents

  const { view, handleFrame, reset } = useSongTrainer({
    notes,
    toleranceCents,
    penaltyMode,
  })

  const mic = usePitchDetection({
    minFreq: range.minFreq,
    maxFreq: range.maxFreq,
    onFrame: handleFrame,
  })

  const demo = useSongDemo(arrangement.notes)
  const fullscreen = useFullscreen()
  const { records, recordCompletion } = useSongProgress()
  const record = records[song.id]

  // A song with no notes reports finished the moment it loads, which is where a custom song sits while its
  // text does not parse. Nobody played anything.
  const finished = view.finished && notes.length > 0

  // The effect reruns for as long as the song stays finished, so credit each run once.
  const creditedRef = useRef(false)
  useEffect(() => {
    if (!finished) {
      creditedRef.current = false
      return
    }
    if (creditedRef.current) return

    creditedRef.current = true
    // Except the custom song, which keeps one id while the melody changes: its best would be for a tune you
    // no longer have.
    if (song.id !== CUSTOM_SONG_ID) recordCompletion(song.id, view.mistakes)
  }, [finished, view.mistakes, song.id, recordCompletion])

  const handleSongChange = useCallback(
    (id: string) => {
      setSongId(id)
      // The new song brings its own `notes`, so useSongTrainer reloads itself.
    },
    [setSongId],
  )

  const listening = mic.status === 'listening'

  // Practising is the one time nothing touches the screen for minutes, so hold it only while running.
  useWakeLock(listening || demo.playing)

  // Playback owns the note row while it runs, so the charts show what is sounding rather than what the
  // trainer waits for. Same helper the engine uses, so the two cannot disagree about "next".
  const demoRow = useMemo(() => noteWindow(notes, demo.index), [notes, demo.index])
  const row = demo.playing ? demoRow : view

  // How much of the song is behind you, counted either way. Not `view.index`, which a mistake can send
  // backwards without uncounting a hit.
  const played = demo.playing ? demo.index : view.hits

  const startDemo = (): void => {
    mic.stop()
    demo.start()
  }

  // While the song plays back, "over" means the playback: playback owns the note row, so resetting the
  // trainer would change nothing on screen.
  const startOver = (): void => {
    if (demo.playing) demo.restart()
    else reset()
  }

  // Once a session ends the counters keep the button awake. Deliberately not the progress bars, which would
  // flicker it on every breath.
  const canStartOver = demo.playing || listening || view.hits > 0 || view.mistakes > 0

  const demoHint = demo.playing
    ? 'Playing the song. The microphone stays off until it stops.'
    : listening
      ? 'Listening. Hold each note for a moment for it to count.'
      : 'Without a microphone the trainer only shows fingerings.'

  // Container `md`: at `lg`'s 1140px this one centred column floats in its own empty half, and `sm` drops the
  // settings selects to 205px, cutting "Soprano recorder (baroque)" off mid-word.
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            {/* The wordmark is the heading, so the h1 takes its name from the image label inside. Below `xs`
                the glyph stands in, the wordmark crowding the counters on a phone. */}
            <Title order={1} lh={1} m={0}>
              <Logo variant="icon" width={34} hiddenFrom="xs" />
              <Logo variant="logotype" width={132} visibleFrom="xs" />
            </Title>
            {/* Hiding this below `sm` saves 81px rather than its own 41 — it also unwraps the counters. */}
            <Text c="dimmed" size="sm" visibleFrom="sm">
              A recorder, tin whistle and ocarina trainer. It waits until you
              play the right note.
            </Text>
          </Stack>
          <Group gap="xs">
            {/* `color="dark"` rather than `dark.4`: an explicit shade turns a light badge from a tint into an
                opaque fill, dropping the text to 4.14:1. */}
            <Badge variant="light" color="dark" leftSection={<MusicNoteIcon size={12} />}>
              {played} / {view.total}
            </Badge>
            <Badge variant="light" color={view.mistakes > 0 ? 'alarm' : 'dark'}>
              mistakes: {view.mistakes}
            </Badge>
            {record !== undefined && (
              <Badge variant="light" color="accent">
                finished ×{record.completions}
              </Badge>
            )}
          </Group>
        </Group>

        {/* Everything about the note being played in one card: three fingerings with their names, then the
            two meters that describe the middle one. */}
        <Paper p="lg" withBorder>
          {songError !== null
            ? (
                /* The whole card, not a line under the textarea: this is where you look when you expect a
                   fingering, and there is nothing else to put here. */
                <Alert
                  color="alarm"
                  variant="light"
                  icon={<WarningIcon size={20} />}
                  title="I cannot read that melody"
                >
                  <Text size="sm">{songError}</Text>
                </Alert>
              )
            : (
                <Stack gap="lg">
                  <NoteSequence
                    instrument={instrument}
                    previous={row.previous}
                    target={row.target}
                    upcoming={row.upcoming}
                    status={view.status}
                    demo={demo.playing}
                  />

                  <Divider visibleFrom="sm" />

                  {/* Hold first: it answers the question you have while a note sounds — "is this counting
                      yet?" The tuner is the finer correction, for once the hold bar refuses to move. */}
                  <ProgressBars
                    holdProgress={view.holdProgress}
                    mistakeProgress={view.mistakeProgress}
                    penaltyMode={penaltyMode}
                  />

                  <Tuner
                    cents={view.cents}
                    toleranceCents={toleranceCents}
                    active={listening && view.detectedNote !== null}
                  />
                </Stack>
              )}
        </Paper>

        {finished && (
          <Alert
            color="accent"
            variant="light"
            icon={<CheckCircleIcon size={20} />}
            title={`${song.title} — played all the way through`}
          >
            <Stack gap="sm" align="flex-start">
              <Text size="sm">
                Mistakes this run: {view.mistakes}
                {record !== undefined && `, personal best: ${record.bestMistakes}`}.
              </Text>
              <Button
                size="sm"
                variant="light"
                color="accent"
                leftSection={<ArrowCounterClockwiseIcon size={16} />}
                onClick={reset}
              >
                Play it again
              </Button>
            </Stack>
          </Alert>
        )}

        <Paper p="lg" withBorder>
          <Stack gap="sm">
            {/* Its own row, full width: the one control you reach for without looking. */}
            <MicButton
              status={mic.status}
              error={mic.error}
              // The mic would hear playback out of the speakers and score it as your playing, so whichever
              // button you press last wins.
              onStart={() => {
                demo.stop()
                void mic.start()
              }}
              onStop={mic.stop}
            />

            <Text size="xs" c="dimmed">
              {demoHint}
            </Text>

            {/* The two toggles are here rather than in the header, which wraps on a 360px phone — and
                fullscreen has to be on screen anyway, the browser granting it only from a tap. Two nowrap
                groups, so a narrow screen drops both under the buttons rather than tearing "Start over". */}
            <Group gap="sm" justify="space-between">
              <Group gap="sm" wrap="nowrap">
                {/* `signal` is the colour of the note you are asked to play, which is what playback shows —
                    and it keeps this off the green of Start. */}
                <Button
                  size="md"
                  variant="light"
                  color="signal"
                  leftSection={
                    demo.playing ? <StopIcon size={18} /> : <PlayIcon size={18} />
                  }
                  onClick={demo.playing ? demo.stop : startDemo}
                  aria-label={demo.playing
                    ? 'Stop playing the song'
                    : 'Play the song through the speakers'}
                >
                  {demo.playing ? 'Stop' : 'Hear it'}
                </Button>
                {/* A real action, so a bordered button at Start's size rather than a text link. `default` and
                    not red: it discards progress, but red would read as a warning about something gone
                    wrong. */}
                <Button
                  size="md"
                  variant="default"
                  leftSection={<ArrowCounterClockwiseIcon size={18} />}
                  onClick={startOver}
                  disabled={!canStartOver}
                  aria-label={demo.playing
                    ? 'Play the song again from the beginning'
                    : 'Start the song over'}
                >
                  Start over
                </Button>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <ColorSchemeToggle />
                {fullscreen.available && (
                  <Tooltip label={fullscreen.active ? 'Leave fullscreen' : 'Fullscreen'}>
                    <ActionIcon
                      variant="default"
                      size={42}
                      onClick={fullscreen.toggle}
                      aria-label={fullscreen.active ? 'Leave fullscreen' : 'Go fullscreen'}
                    >
                      {fullscreen.active
                        ? <ArrowsInIcon size={20} />
                        : <ArrowsOutIcon size={20} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* The one card you are not looking at while playing, so `xl` breaks it off the trainer. */}
        <Paper p="lg" withBorder mt="xl">
          <Stack gap="lg">
            <SongPicker
              song={song}
              arrangement={arrangement}
              instrument={instrument}
              onSongChange={handleSongChange}
              customText={customText}
              onCustomTextChange={setCustomText}
              customError={songError}
            />
            <Divider />
            <SettingsBar
              instrumentId={instrumentId}
              difficultyId={difficultyId}
              penaltyMode={penaltyMode}
              onInstrumentChange={setInstrumentId}
              onDifficultyChange={setDifficultyId}
              onPenaltyChange={setPenaltyMode}
            />
          </Stack>
        </Paper>

        <Stack gap={2}>
          <Text size="xs" c="dimmed" ta="center">
            Pitch detection runs locally in the browser — nothing leaves your
            machine.
          </Text>
          {/* A takedown route in the footer rather than buried in the README, so a rights holder who lands
              here can find it. `--flutex-accent-ink` and not Mantine's anchor colour, which is the filled
              primary and reads 3.51:1 at 12px on a light card. */}
          <Text size="xs" c="dimmed" ta="center">
            The songs are traditional or out of copyright, bar the game themes
            and the tunes taken from recordings. To have anything taken down, write to{' '}
            <Anchor
              inherit
              c="var(--flutex-accent-ink)"
              href="mailto:zefirefemera@proton.me"
            >
              zefirefemera@proton.me
            </Anchor>
            .
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Made by Yann &amp; <Anchor target='_blank' href="https://zefirefemera.xyz">Zefir</Anchor>
          </Text>
        </Stack>
      </Stack>
    </Container>
  )
}
