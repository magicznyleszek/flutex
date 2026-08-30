import { useCallback, useRef, useState } from 'react'

const STORAGE_KEY = 'flutex_progress_v1'

export interface SongRecord {
  /** How many times the song was played to the end. */
  completions: number
  /** Fewest mistakes in a completed run. */
  bestMistakes: number
}

export interface SongProgress {
  records: Readonly<Record<string, SongRecord>>
  recordCompletion: (songId: string, mistakes: number) => void
  reset: () => void
}

function isRecord(value: unknown): value is SongRecord {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<SongRecord>
  return typeof candidate.completions === 'number'
    && typeof candidate.bestMistakes === 'number'
}

/**
 * Stored progress may come from an older version or from a hand edit, so every
 * entry is validated on its own — one broken record does not wipe the rest.
 */
function readRecords(): Record<string, SongRecord> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return {}

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}

    const result: Record<string, SongRecord> = {}
    for (const [id, entry] of Object.entries(parsed)) {
      if (isRecord(entry)) result[id] = entry
    }
    return result
  } catch {
    return {}
  }
}

function writeRecords(records: Record<string, SongRecord>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // A failed write is no reason to interrupt practice.
  }
}

export function useSongProgress(): SongProgress {
  const [records, setRecords] = useState<Record<string, SongRecord>>(readRecords)
  // The write goes to localStorage right away, so the state is mirrored in a
  // ref — a setState updater is no place for side effects.
  const recordsRef = useRef(records)

  const commit = useCallback((next: Record<string, SongRecord>) => {
    recordsRef.current = next
    writeRecords(next)
    setRecords(next)
  }, [])

  const recordCompletion = useCallback((songId: string, mistakes: number) => {
    const previous = recordsRef.current[songId]

    commit({
      ...recordsRef.current,
      [songId]: {
        completions: (previous?.completions ?? 0) + 1,
        bestMistakes: Math.min(previous?.bestMistakes ?? Infinity, mistakes),
      },
    })
  }, [commit])

  const reset = useCallback(() => commit({}), [commit])

  return { records, recordCompletion, reset }
}
