import { Anchor, Button, Code, CopyButton, Group, Stack, Text, Textarea } from '@mantine/core'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { type JSX, useMemo } from 'react'

import { songDefinition, type SongDefinition } from '../data/songDefinition'
import type { Song } from '../data/songUtils'
import * as classes from './CustomSongEditor.module.css'

const README = 'https://github.com/magicznyleszek/flutex#writing-your-own-song'

/** Short enough to read in the placeholder, and it is a real melody: the start of Ode to Joy. */
const EXAMPLE = 'F#5 F#5 G5 A5 | A5 G5 F#5 E5 | D5:2 E5:2'

/**
 * What copying the block would get you, in the terms `songs.ts` cares about — whether the entry
 * would play as written on every instrument, which is what the library's own test demands of it.
 * The shift named here is not the one the `+n semitones` badge shows: that one fits the melody to
 * the instrument in your hand, this one fits it to all five at once.
 */
function definitionSentence({ semitones, strays, key, needsTitle }: SongDefinition): string {
  if (strays.length > 0) {
    return `Not ready for the library: ${strays.join(', ')} fall outside the ten notes every chart `
      + 'shares. It needs editing, or an overrides entry of its own.'
  }

  const move = semitones === 0
    ? 'every instrument plays it as written'
    : `transposed ${semitones > 0 ? '+' : ''}${semitones} into ${key}, and every instrument plays `
      + 'it as written'

  return `Ready for the library: ${move}. Fill in the `
    + `${needsTitle ? 'title, ' : ''}subtitle and tags once it is pasted.`
}

export interface CustomSongEditorProps {
  /** The paste as it currently parses — only its notes and title are read here. */
  song: Song
  /** The raw text of the custom song, shown whether or not it currently parses. */
  customText: string
  onCustomTextChange: (text: string) => void
  /** Why the text does not parse, or null. The message itself is shown by the trainer. */
  customError: string | null
}

/**
 * The box you write your own melody in, plus the button that turns it into a library entry.
 * Rendered inside the song picker's stack, which is why this is a fragment and sets no gap of its
 * own.
 */
export function CustomSongEditor({
  song,
  customText,
  onCustomTextChange,
  customError,
}: CustomSongEditorProps): JSX.Element {
  // Only worth the transposition search once the paste parses. Memoised because it runs a shift
  // search over the whole melody and the text changes on every keystroke.
  const definition = useMemo(
    () => (customError === null && song.notes.length > 0 ? songDefinition(customText, song) : null),
    [customError, customText, song],
  )

  return (
    <>
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

      {/* The way a tune you like gets into the library: paste ABC here, then paste the block
          into `songs.ts`. Doing it by hand means finding the transposition yourself, and a
          wrong one fails the test suite rather than looking wrong. */}
      {definition !== null && (
        <Stack gap={4}>
          <Group gap="xs">
            <CopyButton value={definition.block} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="light"
                  color={copied ? 'accent' : 'dark'}
                  leftSection={copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy song definition'}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Text size="xs" c="dimmed">{definitionSentence(definition)}</Text>
        </Stack>
      )}
    </>
  )
}
