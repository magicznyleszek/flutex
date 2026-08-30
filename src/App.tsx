import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
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
import { DEFAULT_SONG_ID, getSong, isSongId, songNoteNames } from './data/songs'
import { useFullscreen } from './hooks/useFullscreen'
import { useLocalStorage } from './hooks/useLocalStorage'
import { usePitchDetection } from './hooks/usePitchDetection'
import { useSongDemo } from './hooks/useSongDemo'
import { useSongProgress } from './hooks/useSongProgress'
import { useSongTrainer } from './hooks/useSongTrainer'
import { noteWindow, type PenaltyMode } from './lib/trainer'

/** Renaming the `fluteTrainer_*` keys drops settings users have already saved. */
const STORAGE_KEYS = {
  instrument: 'fluteTrainer_instrument',
  difficulty: 'fluteTrainer_difficulty',
  penalty: 'fluteTrainer_penalty',
  song: 'flutex_song',
} as const

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

  const instrument = INSTRUMENTS[instrumentId]
  const song = useMemo(() => getSong(songId), [songId])
  const notes = useMemo(() => songNoteNames(song), [song])
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

  const demo = useSongDemo(song.notes)
  const fullscreen = useFullscreen()
  const { records, recordCompletion } = useSongProgress()
  const record = records[song.id]

  // The effect reruns for as long as the song stays finished, so credit each run once.
  const creditedRef = useRef(false)
  useEffect(() => {
    if (!view.finished) {
      creditedRef.current = false
      return
    }
    if (creditedRef.current) return

    creditedRef.current = true
    recordCompletion(song.id, view.mistakes)
  }, [view.finished, view.mistakes, song.id, recordCompletion])

  const handleSongChange = useCallback(
    (id: string) => {
      setSongId(id)
      // The new song brings its own `notes`, so useSongTrainer reloads itself.
    },
    [setSongId],
  )

  const listening = mic.status === 'listening'

  // Playback owns the note row while it runs, so the charts show what is sounding rather
  // than the note the trainer is still waiting for. Same helper the engine uses, so the two
  // rows cannot disagree about which note is "next".
  const demoRow = useMemo(() => noteWindow(notes, demo.index), [notes, demo.index])
  const row = demo.playing ? demoRow : view

  const startDemo = (): void => {
    mic.stop()
    demo.start()
  }

  const demoHint = demo.playing
    ? 'Playing the song. The microphone stays off until it stops.'
    : listening
      ? 'Listening. Hold each note for a moment for it to count.'
      : 'Without a microphone the trainer only shows fingerings.'

  // Container `md` rather than `lg`: the trainer used to be a two-column grid and needed the
  // width. It is one centred column now, and at 1140px everything in it floated in its own
  // empty half of the card. Not `sm` either — that drops the three settings selects to 205px
  // each, which cuts "Soprano recorder (baroque)" off mid-word.
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            {/* The wordmark is the heading, so the h1 takes its accessible name from
                the image label inside. Below `xs` the glyph stands in, because the
                wordmark crowds the counters on a phone. */}
            <Title order={1} lh={1} m={0}>
              <Logo variant="icon" width={34} hiddenFrom="xs" />
              <Logo variant="logotype" width={132} visibleFrom="xs" />
            </Title>
            {/* `visibleFrom` rather than `hiddenFrom`: Mantine's breakpoint props are
                min-width only. Hiding this below `sm` saves 81px rather than its own 41,
                because it also wraps the counters onto a second row. */}
            <Text c="dimmed" size="sm" visibleFrom="sm">
              A recorder and tin whistle trainer. It waits until you play the
              right note.
            </Text>
          </Stack>
          <Group gap="xs">
            {/* `color="dark"` rather than `dark.4`: an explicit shade turns a light
                badge from a tint into an opaque fill, which drops the text to 4.14:1. */}
            <Badge variant="light" color="dark" leftSection={<MusicNoteIcon size={12} />}>
              {view.hits} / {view.total}
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

        {/* Everything about the note being played, in one card: the fingering for the
            previous, current and next note with their names, then the two meters that
            describe the middle one. The instrument's own chart used to sit in a second
            column, which is now the middle of this row. */}
        <Paper p="lg" radius="lg" withBorder>
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

            <Tuner
              cents={view.cents}
              toleranceCents={toleranceCents}
              active={listening && view.detectedNote !== null}
            />

            <ProgressBars
              holdProgress={view.holdProgress}
              mistakeProgress={view.mistakeProgress}
              penaltyMode={penaltyMode}
            />
          </Stack>
        </Paper>

        {view.finished && (
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

        <Paper p="lg" radius="lg" withBorder>
          <Stack gap="sm">
            {/* The two icon controls sit beside the microphone button rather than in
                the header, which wraps on a 360px phone. Fullscreen has to be on
                screen anyway: the browser only grants the request from a tap. */}
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <Box flex={1}>
                <MicButton
                  status={mic.status}
                  error={mic.error}
                  // Playback comes out of the speakers, which the microphone would hear and
                  // score as your playing. Whichever button you press wins.
                  onStart={() => {
                    demo.stop()
                    void mic.start()
                  }}
                  onStop={mic.stop}
                />
              </Box>
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
            {/* `miw` on the text is what wraps the two buttons onto their own line on a
                phone. Without it `flex={1}` lets the sentence squeeze down to a word a line
                and the buttons stay wedged beside it. */}
            <Group justify="space-between" gap="sm">
              <Text size="xs" c="dimmed" flex={1} miw={180}>
                {demoHint}
              </Text>
              <Group gap="sm" wrap="nowrap">
                {/* `signal` is the colour of the note you are being asked to play, which is
                    what playback is doing — and it keeps this off the green of Start and the
                    neutral of Start over. */}
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
                {/* Restarting the song is a real action, not an aside, so it gets a bordered
                    button at the same size as Start rather than the dimmed text link it was.
                    `default` and not a colour: it discards your progress, but red would read
                    as a warning about something that has already gone wrong. */}
                <Button
                  size="md"
                  variant="default"
                  leftSection={<ArrowCounterClockwiseIcon size={18} />}
                  onClick={reset}
                >
                  Start over
                </Button>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* The settings are the one card you are not looking at while playing, so it gets
            `xl` on top of the stack's own `lg` to break it away from the trainer. */}
        <Paper p="lg" radius="lg" withBorder mt="xl">
          <Stack gap="lg">
            <SongPicker
              song={song}
              instrument={instrument}
              onSongChange={handleSongChange}
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
          {/* A takedown route in the footer rather than buried in the README, so a rights
              holder who lands here can find it without asking. `--flutex-accent-ink` and not
              Mantine's own anchor colour: that one is the filled primary, accent-8, which at
              12px reads 3.51:1 on a light card. */}
          <Text size="xs" c="dimmed" ta="center">
            Melodies are transcriptions written out for practice. To have one taken
            down, write to{' '}
            <Anchor
              inherit
              c="var(--flutex-accent-ink)"
              href="mailto:zefirefemara@proton.me"
            >
              zefirefemara@proton.me
            </Anchor>
            .
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Made by Yann &amp; Zefir
          </Text>
        </Stack>
      </Stack>
    </Container>
  )
}
