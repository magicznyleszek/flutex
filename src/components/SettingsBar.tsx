import { SimpleGrid, Stack, Text } from '@mantine/core'
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
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
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
      </SimpleGrid>

      <Text size="xs" c="dimmed">
        {DIFFICULTIES[difficultyId].description} {PENALTIES[penaltyMode].description}
      </Text>
    </Stack>
  )
}
