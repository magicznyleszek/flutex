import {
  Alert,
  Badge,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  MusicNoteIcon,
} from '@phosphor-icons/react'
import { type JSX, useCallback, useEffect, useMemo, useRef } from 'react'

import { FluteDiagram } from './components/FluteDiagram'
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
import { useLocalStorage } from './hooks/useLocalStorage'
import { usePitchDetection } from './hooks/usePitchDetection'
import { useSongProgress } from './hooks/useSongProgress'
import { useSongTrainer } from './hooks/useSongTrainer'
import type { PenaltyMode } from './lib/trainer'

/**
 * The instrument, difficulty and penalty keys keep their old names so settings
 * saved by the previous version of the app are not lost.
 */
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

  const { records, recordCompletion } = useSongProgress()
  const record = records[song.id]

  // A completion is credited once per run, not once per render.
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            {/* The logo is the wordmark, so it *is* the heading — the h1 takes
                its accessible name from the image label inside. The wordmark
                crowds the counters on a phone, so below `xs` the glyph stands
                in for it; the hidden one is `display: none` and therefore out
                of the accessibility tree too. */}
            <Title order={1} lh={1} m={0}>
              <Logo variant="icon" width={34} hiddenFrom="xs" />
              <Logo variant="logotype" width={132} visibleFrom="xs" />
            </Title>
            <Text c="dimmed" size="sm">
              A recorder and tin whistle trainer. It waits until you play the
              right note.
            </Text>
          </Stack>
          <Group gap="xs">
            <Badge variant="light" color="dark.4" leftSection={<MusicNoteIcon size={12} />}>
              {view.hits} / {view.total}
            </Badge>
            <Badge variant="light" color={view.mistakes > 0 ? 'alarm' : 'dark.4'}>
              mistakes: {view.mistakes}
            </Badge>
            {record !== undefined && (
              <Badge variant="light" color="accent">
                finished ×{record.completions}
              </Badge>
            )}
          </Group>
        </Group>

        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper p="lg" radius="lg" withBorder h="100%">
              <Stack gap="md" h="100%" justify="center">
                <Text size="sm" fw={600} ta="center">{instrument.shortName}</Text>
                <FluteDiagram instrument={instrument} note={view.target} />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              <Paper p="lg" radius="lg" withBorder>
                <Stack gap="lg">
                  <NoteSequence
                    previous={view.previous}
                    target={view.target}
                    next={view.next}
                    targetBeats={targetBeats}
                    status={view.status}
                  />

                  <Divider />

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
                  <MicButton
                    status={mic.status}
                    error={mic.error}
                    onStart={() => void mic.start()}
                    onStop={mic.stop}
                  />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {listening
                        ? 'Listening. Hold each note for a moment for it to count.'
                        : 'Without a microphone the trainer only shows fingerings.'}
                    </Text>
                    <Button
                      size="compact-sm"
                      variant="subtle"
                      // `gray` is Mantine's stock cool neutral and reads blue
                      // beside these browns; dark.2 is the shade the hint text
                      // next to it already uses.
                      color="dark.2"
                      leftSection={<ArrowCounterClockwiseIcon size={14} />}
                      onClick={reset}
                    >
                      Start over
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        <Paper p="lg" radius="lg" withBorder>
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

        <Text size="xs" c="dimmed" ta="center">
          Pitch detection runs locally in the browser — nothing leaves your
          machine.
        </Text>
      </Stack>
    </Container>
  )
}
