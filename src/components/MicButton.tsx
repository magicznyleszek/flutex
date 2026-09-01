import { Alert, Button, Stack } from '@mantine/core'
import { MicrophoneIcon, MicrophoneSlashIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import type { MicStatus } from '../hooks/usePitchDetection'

export interface MicButtonProps {
  status: MicStatus
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function MicButton({ status, error, onStart, onStop }: MicButtonProps): JSX.Element {
  const listening = status === 'listening'

  return (
    <Stack gap="xs">
      <Button
        size="md"
        fullWidth
        color={listening ? 'alarm' : 'accent'}
        loading={status === 'starting'}
        leftSection={
          listening ? <MicrophoneSlashIcon size={20} /> : <MicrophoneIcon size={20} />
        }
        onClick={listening ? onStop : onStart}
        // On its own, "Start" does not say what starts.
        aria-label={listening
          ? 'Stop listening through the microphone'
          : 'Start listening through the microphone'}
      >
        {listening ? 'Stop' : 'Start'}
      </Button>

      {error !== null && (
        <Alert color="alarm" variant="light" title="Microphone unavailable">
          {error}
        </Alert>
      )}
    </Stack>
  )
}
