import { Alert, Badge, Group, Stack, Text } from '@mantine/core'
import { MusicNotesIcon, WarningIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { CUSTOM_SONG_TITLE } from '../data/customSong'
import { type Instrument, unplayableNotes } from '../data/instruments'
import { isSongId, SONGS } from '../data/songs'
import {
  type Arrangement,
  CUSTOM_SONG_ID,
  SONG_CATEGORIES,
  type Song,
  songNoteNames,
} from '../data/songUtils'
import { CustomSongEditor } from './CustomSongEditor'
import { SettingSelect } from './SettingSelect'

/**
 * The library as the picker's headed groups, built once since `SONGS` never changes. An empty
 * category is dropped rather than drawn as a heading over nothing.
 */
const SONG_GROUPS = SONG_CATEGORIES
  .map((category) => ({
    group: category.label,
    items: SONGS
      .filter((entry) => entry.category === category.slug)
      .map((entry) => ({ value: entry.id, label: entry.title })),
  }))
  .filter((group) => group.items.length > 0)

/**
 * What the shift did to the melody, in words. Whole octaves get their own sentence: a tune moved up
 * an octave is still in its written key, and "transposed into E, the written key is E" reads as a bug.
 */
function shiftSentence(arrangement: Arrangement, written: string, instrument: Instrument): string {
  const { semitones, key } = arrangement
  const octaves = Math.abs(semitones) / 12
  const reach = `so the ${instrument.shortName} can reach it`

  if (Number.isInteger(octaves)) {
    const many = octaves === 1 ? 'an octave' : `${octaves} octaves`
    return `Moved ${semitones > 0 ? 'up' : 'down'} ${many} ${reach}.`
  }

  return `Transposed into ${key} ${reach}. The written key is ${written}.`
}

export interface SongPickerProps {
  song: Song
  /** The song as this instrument will play it, which is what the notes below describe. */
  arrangement: Arrangement
  instrument: Instrument
  onSongChange: (id: string) => void
  /** These three are only for the custom entry, and go straight through to its editor. */
  customText: string
  onCustomTextChange: (text: string) => void
  customError: string | null
}

export function SongPicker({
  song,
  arrangement,
  instrument,
  onSongChange,
  customText,
  onCustomTextChange,
  customError,
}: SongPickerProps): JSX.Element {
  // The arrangement's notes, after the swaps — so what is left has no grip and nothing close by.
  const missing = unplayableNotes(instrument, songNoteNames(arrangement))
  const { approximations } = arrangement
  const unfingered = [...approximations.map((swap) => swap.written), ...missing]

  return (
    <Stack gap="xs">
      <SettingSelect
        label="Song"
        icon={<MusicNotesIcon size={16} />}
        value={song.id}
        isValid={isSongId}
        onChange={onSongChange}
        // Thirty-odd entries is past the point of scrolling to find one by eye.
        searchable
        // Yours first, ahead of every heading: it is the one entry whose contents you decide.
        options={[{ value: CUSTOM_SONG_ID, label: CUSTOM_SONG_TITLE }, ...SONG_GROUPS]}
      />

      {song.id === CUSTOM_SONG_ID && (
        <CustomSongEditor
          song={song}
          customText={customText}
          onCustomTextChange={onCustomTextChange}
          customError={customError}
        />
      )}

      <Group gap="xs">
        {/* `color="dark"`, not `dark.4`: naming a shade fills a light badge opaquely instead of
            tinting it, dropping the text to 4.14:1. */}
        <Badge variant="light" color="dark" size="sm">{song.notes.length} notes</Badge>
        {song.tags.map((tag) => (
          <Badge key={tag} variant="light" color="accent" size="sm">{tag}</Badge>
        ))}
        {/* Only when the melody was moved. A song that fits is played as written. */}
        {arrangement.semitones !== 0 && (
          <Badge variant="light" color="signal" size="sm">
            {arrangement.semitones > 0 ? '+' : '−'}
            {Math.abs(arrangement.semitones)} semitones
          </Badge>
        )}
      </Group>

      {song.subtitle !== undefined && (
        <Text size="xs" c="dimmed">{song.subtitle}</Text>
      )}

      {arrangement.semitones !== 0 && (
        <Text size="xs" c="dimmed">{shiftSentence(arrangement, song.key, instrument)}</Text>
      )}

      {unfingered.length > 0 && (
        <Alert
          color="signal"
          variant="light"
          icon={<WarningIcon size={18} />}
          title="The song does not fit this instrument"
        >
          No fingering for: {unfingered.join(', ')}.{' '}
          {/* Spelled out as pairs: the chart draws the note you will hold, not the one the melody
              names. The same stand-in twice is normal — notes past the top of a chart all collapse
              onto its highest grip. */}
          {approximations.length > 0 && (
            <>
              The trainer displays close approximations for those notes:{' '}
              {approximations.map((swap) => `${swap.written} → ${swap.played}`).join(', ')}.{' '}
            </>
          )}
          {/* Only when a note is further out than a stand-in can reach: a pasted melody too wide. */}
          {missing.length > 0 && (
            <>
              Nothing is close enough to stand in for {missing.join(', ')}, so{' '}
              {missing.length === 1 ? 'that slot stays' : 'those slots stay'} blank.
            </>
          )}
        </Alert>
      )}
    </Stack>
  )
}
