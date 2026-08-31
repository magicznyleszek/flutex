import { Alert, Anchor, Badge, Code, Group, Stack, Text, Textarea } from '@mantine/core'
import { MusicNotesIcon, WarningIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import { CUSTOM_SONG_TITLE } from '../data/customSong'
import { type Instrument, unplayableNotes } from '../data/instruments'
import {
  type Arrangement,
  CUSTOM_SONG_ID,
  isSongId,
  SONGS,
  type Song,
  songNoteNames,
} from '../data/songs'
import { SettingSelect } from './SettingSelect'
import * as classes from './SongPicker.module.css'

const README = 'https://github.com/magicznyleszek/flutex#writing-your-own-song'

/** Short enough to read in the placeholder, and it is a real melody: the start of Ode to Joy. */
const EXAMPLE = 'F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5:2 E5:2'

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
  /** The raw text of the custom song, shown whether or not it currently parses. */
  customText: string
  onCustomTextChange: (text: string) => void
  /** Why the text does not parse, or null. The message itself is shown by the trainer. */
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
  // The arrangement's notes, not the song's: a melody that was out of range until it got moved
  // is not missing anything, and one that is still short of a grip after the move genuinely is.
  const missing = unplayableNotes(instrument, songNoteNames(arrangement))
  const custom = song.id === CUSTOM_SONG_ID

  return (
    <Stack gap="xs">
      <SettingSelect
        label="Song"
        icon={<MusicNotesIcon size={16} />}
        value={song.id}
        isValid={isSongId}
        onChange={onSongChange}
        // Yours first, because it is the only entry whose contents you decide, and it would
        // otherwise be the one option nobody scrolls to.
        options={[
          { value: CUSTOM_SONG_ID, label: CUSTOM_SONG_TITLE },
          ...SONGS.map((entry) => ({ value: entry.id, label: entry.title })),
        ]}
      />

      {custom && (
        <Textarea
          label="Your melody"
          description={
            <>
              Note names with an optional <Code className={classes.token}>:beats</Code>, or paste
              an ABC tune, headers and all. Stays in this browser.{' '}
              {/* Same colour as the footer link and for the same reason: Mantine's own anchor
                  colour is the filled primary, which reads 3.51:1 at this size. */}
              <Anchor
                inherit
                c="var(--flutex-accent-ink)"
                href={README}
                target="_blank"
              >
                Both formats, written out
              </Anchor>.
            </>
          }
          placeholder={EXAMPLE}
          value={customText}
          onChange={(event) => onCustomTextChange(event.currentTarget.value)}
          // The message goes where the fingerings would be, which is where you are looking. This
          // only marks the box it came from — and tells a screen reader the field is invalid.
          error={customError !== null}
          classNames={{ input: classes.editor }}
          autosize
          minRows={3}
          maxRows={12}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
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
