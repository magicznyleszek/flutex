import { Alert, Badge, Group, Stack, Text } from '@mantine/core'
import { MusicNotesIcon, WarningIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { type Instrument, unplayableNotes } from '../data/instruments'
import { isSongId, SONGS, type Song } from '../data/songs'
import { SettingSelect } from './SettingSelect'

export interface SongPickerProps {
  song: Song
  instrument: Instrument
  onSongChange: (id: string) => void
}

export function SongPicker({ song, instrument, onSongChange }: SongPickerProps): JSX.Element {
  const missing = unplayableNotes(instrument, song.notes.map((entry) => entry.note))

  return (
    <Stack gap="xs">
      <SettingSelect
        label="Song"
        icon={<MusicNotesIcon size={16} />}
        value={song.id}
        isValid={isSongId}
        onChange={onSongChange}
        options={SONGS.map((entry) => ({ value: entry.id, label: entry.title }))}
      />

      <Group gap="xs">
        {/* `color="dark"` and not `dark.4`: naming an explicit shade makes
            Mantine fill a light badge with that shade opaquely instead of
            tinting it, which put saltpan text on cement at 3.60:1. */}
        <Badge variant="light" color="dark" size="sm">{song.notes.length} notes</Badge>
        {song.tags.map((tag) => (
          <Badge key={tag} variant="light" color="accent" size="sm">{tag}</Badge>
        ))}
      </Group>

      {song.subtitle !== undefined && (
        <Text size="xs" c="dimmed">{song.subtitle}</Text>
      )}

      {missing.length > 0 && (
        <Alert
          color="signal"
          variant="light"
          icon={<WarningIcon size={18} />}
          title="The song does not fit this instrument"
        >
          No fingering for: {missing.join(', ')}. The trainer cannot show a grip for
          those notes.
        </Alert>
      )}
    </Stack>
  )
}
