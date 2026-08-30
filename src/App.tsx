import {
  ActionIcon,
  Alert,
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
import { useSongProgress } from './hooks/useSongProgress'
import { useSongTrainer } from './hooks/useSongTrainer'
import type { PenaltyMode } from './lib/trainer'

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

  const targetBeats = song.notes[view.index]?.beats ?? null
  const listening = mic.status === 'listening'

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
              previous={view.previous}
              target={view.target}
              upcoming={view.upcoming}
              targetBeats={targetBeats}
              status={view.status}
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
                  onStart={() => void mic.start()}
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
            <Group justify="space-between" gap="sm">
              <Text size="xs" c="dimmed" flex={1}>
                {listening
                  ? 'Listening. Hold each note for a moment for it to count.'
                  : 'Without a microphone the trainer only shows fingerings.'}
              </Text>
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
          <Text size="xs" c="dimmed" ta="center">
            Made by Yann &amp; Zefir
          </Text>
        </Stack>
      </Stack>
    </Container>
  )
}
