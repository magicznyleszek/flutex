import { Grid, Stack, Text } from '@mantine/core'
import { FlagIcon, GaugeIcon, WaveSineIcon } from '@phosphor-icons/react'
import type { JSX } from 'react'

import {
  INSTRUMENT_LIST,
  isInstrumentId,
  type InstrumentId,
} from '../data/instruments'
import {
  DIFFICULTIES,
  DIFFICULTY_LIST,
  isDifficultyId,
  isPenaltyMode,
  PENALTIES,
  PENALTY_LIST,
  type DifficultyId,
} from '../data/settings'
import type { PenaltyMode } from '../lib/trainer'
import { SettingSelect } from './SettingSelect'

export interface SettingsBarProps {
  instrumentId: InstrumentId
  difficultyId: DifficultyId
  penaltyMode: PenaltyMode
  onInstrumentChange: (value: InstrumentId) => void
  onDifficultyChange: (value: DifficultyId) => void
  onPenaltyChange: (value: PenaltyMode) => void
}

export function SettingsBar({
  instrumentId,
  difficultyId,
  penaltyMode,
  onInstrumentChange,
  onDifficultyChange,
  onPenaltyChange,
}: SettingsBarProps): JSX.Element {
  return (
    <Stack gap="xs">
      {/* Uneven spans rather than three equal columns, because the option labels are not
          remotely the same length: "Soprano recorder (baroque fingering)" is 36 characters and
          gets cut off mid-word in a third of the card, while the other two are half that. It
          takes a full row of its own until there is enough width for the 6/3/3 split. */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SettingSelect
            label="Instrument"
            icon={<WaveSineIcon size={16} />}
            value={instrumentId}
            isValid={isInstrumentId}
            onChange={onInstrumentChange}
            options={INSTRUMENT_LIST.map((instrument) => ({
              value: instrument.id,
              label: instrument.name,
            }))}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <SettingSelect
            label="Tolerance"
            icon={<GaugeIcon size={16} />}
            value={difficultyId}
            isValid={isDifficultyId}
            onChange={onDifficultyChange}
            options={DIFFICULTY_LIST.map((level) => ({
              value: level.id,
              label: level.label,
            }))}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <SettingSelect
            label="Mistake penalty"
            icon={<FlagIcon size={16} />}
            value={penaltyMode}
            isValid={isPenaltyMode}
            onChange={onPenaltyChange}
            options={PENALTY_LIST.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
          />
        </Grid.Col>
      </Grid>

      <Text size="xs" c="dimmed">
        {DIFFICULTIES[difficultyId].description} {PENALTIES[penaltyMode].description}
      </Text>
    </Stack>
  )
}
