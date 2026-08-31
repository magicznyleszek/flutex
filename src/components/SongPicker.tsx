import { Alert, Badge, Group, Stack, Text } from '@mantine/core'
import { MusicNotesIcon, WarningIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { CUSTOM_SONG_TITLE } from '../data/customSong'
import { type Instrument, unplayableNotes } from '../data/instruments'
import { isSongId, SONGS } from '../data/songs'
import { type Arrangement, CUSTOM_SONG_ID, type Song, songNoteNames } from '../data/songUtils'
import { CustomSongEditor } from './CustomSongEditor'
import { SettingSelect } from './SettingSelect'

/**
 * What the shift did to the melody, in words. A whole number of octaves is deliberately a
 * different sentence: a tune moved up an octave is still in the key it was written in, and
 * "transposed into E, the written key is E" reads as a bug.
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
  // The arrangement's notes, not the song's, and after the near notes have been swapped in — so
  // what is left is only the notes with no grip and nothing close enough to offer instead.
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
        // Yours first, because it is the only entry whose contents you decide, and it would
        // otherwise be the one option nobody scrolls to.
        options={[
          { value: CUSTOM_SONG_ID, label: CUSTOM_SONG_TITLE },
          ...SONGS.map((entry) => ({ value: entry.id, label: entry.title })),
        ]}
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
        {/* `color="dark"`, not `dark.4`: naming a shade makes Mantine fill a light
            badge opaquely instead of tinting it, dropping the text to 4.14:1. */}
        <Badge variant="light" color="dark" size="sm">{song.notes.length} notes</Badge>
        {song.tags.map((tag) => (
          <Badge key={tag} variant="light" color="accent" size="sm">{tag}</Badge>
        ))}
        {/* Only when the melody was actually moved, which is the uncommon case — a song that
            fits is played as written and there is nothing to say about it. */}
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
          {/* Spelled out as pairs rather than left at "approximations", because the note the
              chart draws is the one you will be holding, and it is not the one the melody
              names. Same note twice over is normal — everything past the top of a chart
              collapses onto its highest grip. */}
          {approximations.length > 0 && (
            <>
              The trainer displays close approximations for those notes:{' '}
              {approximations.map((swap) => `${swap.written} → ${swap.played}`).join(', ')}.{' '}
            </>
          )}
          {/* Only when a note is further out than a stand-in can reach, which takes a pasted
              melody with a wider range than the instrument has. */}
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
