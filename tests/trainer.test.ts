import { noteToMidi } from '../src/lib/music'
import {
  createTrainerEngine,
  LOOKAHEAD,
  noteWindow,
  type PenaltyMode,
  type TrainerEngine,
  type TrainerOptions,
  type TrainerSnapshot,
} from '../src/lib/trainer'

const SONG = ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6']

// Short thresholds keep every test to a handful of frames.
const HOLD = 4
const MISTAKE_LIMIT = 4
const COOLDOWN = 3
const PENALTY_COOLDOWN = 5
const BACK_STEPS = 3

const OPTIONS: Partial<TrainerOptions> = {
  toleranceCents: 25,
  penaltyMode: 'wait',
  holdFrames: HOLD,
  mistakeLimitFrames: MISTAKE_LIMIT,
  cooldownFrames: COOLDOWN,
  penaltyCooldownFrames: PENALTY_COOLDOWN,
  backSteps: BACK_STEPS,
}

const engineWith = (penaltyMode: PenaltyMode = 'wait', song = SONG): TrainerEngine =>
  createTrainerEngine(song, { ...OPTIONS, penaltyMode })

/**
 * Feeds N frames of the same note and returns the last state. `cents` is measured from the target on
 * that frame, so leaving it out means "dead in tune for the note named" — a hundred cents per
 * semitone away for a wrong one, as the mic hook would report it. Pass it to detune instead.
 */
function feed(
  engine: TrainerEngine,
  frames: number,
  note: string | null,
  cents?: number,
): TrainerSnapshot {
  let snapshot = engine.snapshot()

  for (let i = 0; i < frames; i++) {
    const { target } = engine.snapshot()
    const distance
      = note === null || target === null
        ? 0
        : ((noteToMidi(note) ?? 0) - (noteToMidi(target) ?? 0)) * 100

    snapshot = engine.step({ note, cents: cents ?? distance })
  }

  return snapshot
}

/** Scores the current note and waits out the cooldown and any release. */
function playNote(engine: TrainerEngine): TrainerSnapshot {
  const target = engine.snapshot().target
  feed(engine, HOLD, target)
  return feed(engine, COOLDOWN, null)
}

describe('initial state', () => {
  it('targets the first note and knows its neighbours', () => {
    const snapshot = engineWith().snapshot()

    expect(snapshot.index).toBe(0)
    expect(snapshot.target).toBe('D5')
    expect(snapshot.previous).toBeNull()
    expect(snapshot.upcoming).toEqual(['E5', 'F#5', 'G5'])
    expect(snapshot.total).toBe(SONG.length)
    expect(snapshot.finished).toBe(false)
    expect(snapshot.status).toBe('waiting')
  })

  // The UI draws a fixed number of slots off this array, so a shorter one would shift the row.
  it('pads the lookahead with nulls near the end of the song', () => {
    const snapshot = createTrainerEngine(['D5', 'E5'], OPTIONS).snapshot()

    expect(snapshot.upcoming).toHaveLength(LOOKAHEAD)
    expect(snapshot.upcoming).toEqual(['E5', null, null])
  })

  // Playback lays out the note row from `noteWindow`, the trainer from its snapshot. Disagreeing,
  // "next" would mean one note during the demo and another while playing.
  it('reads the same window the engine puts in its snapshot', () => {
    const engine = engineWith()
    playNote(engine)
    const snapshot = engine.snapshot()

    expect(noteWindow(SONG, snapshot.index)).toEqual({
      previous: snapshot.previous,
      target: snapshot.target,
      upcoming: snapshot.upcoming,
    })
  })

  it('treats an empty song as finished right away', () => {
    const snapshot = createTrainerEngine([], OPTIONS).snapshot()

    expect(snapshot.finished).toBe(true)
    expect(snapshot.status).toBe('finished')
    expect(snapshot.target).toBeNull()
  })
})

describe('scoring notes', () => {
  it('advances once the note is held for the required frames', () => {
    const engine = engineWith()

    const almost = feed(engine, 3, 'D5')
    expect(almost.index).toBe(0)
    expect(almost.holdProgress).toBeCloseTo(0.75)
    expect(almost.status).toBe('holding')

    const hit = engine.step({ note: 'D5', cents: 0 })
    expect(hit.index).toBe(1)
    expect(hit.target).toBe('E5')
    expect(hit.hits).toBe(1)
    expect(hit.holdProgress).toBe(0)
  })

  it('does not score a note outside the tolerance', () => {
    const engine = engineWith()

    const snapshot = feed(engine, 10, 'D5', 40)
    expect(snapshot.index).toBe(0)
    expect(snapshot.holdProgress).toBe(0)
  })

  it('scores a note exactly on the tolerance boundary', () => {
    const engine = engineWith()

    const snapshot = feed(engine, HOLD, 'D5', -25)
    expect(snapshot.index).toBe(1)
  })

  // The wide tolerances only mean anything if cents alone decide the hit: a whistle a semitone
  // sharp is named as the note above, so asking for the name too would cap every setting at ±50.
  it('scores a mistuned note the detector names as its neighbour', () => {
    const engine = engineWith()
    engine.configure({ toleranceCents: 100 })

    expect(feed(engine, HOLD, 'D#5').index).toBe(1)
  })

  it('still calls that neighbour wrong at a narrow tolerance', () => {
    const engine = engineWith()

    const snapshot = feed(engine, HOLD, 'D#5')
    expect(snapshot.index).toBe(0)
    expect(snapshot.status).toBe('wrong')
  })

  // Silence arrives as zero cents, the same as a perfect note. Only the missing name separates them.
  it('never scores silence, however wide the tolerance', () => {
    const engine = engineWith()
    engine.configure({ toleranceCents: 100 })

    const snapshot = feed(engine, 50, null, 0)
    expect(snapshot.index).toBe(0)
    expect(snapshot.holdProgress).toBe(0)
    expect(snapshot.status).toBe('waiting')
  })

  it('finishes the song after the last note', () => {
    const engine = engineWith()
    for (let i = 0; i < SONG.length; i++) playNote(engine)

    const snapshot = engine.snapshot()
    expect(snapshot.finished).toBe(true)
    expect(snapshot.status).toBe('finished')
    expect(snapshot.hits).toBe(SONG.length)
    expect(snapshot.target).toBeNull()
  })

  it('ignores further frames once finished', () => {
    const engine = engineWith()
    for (let i = 0; i < SONG.length; i++) playNote(engine)

    const after = feed(engine, 50, 'D5')
    expect(after.hits).toBe(SONG.length)
    expect(after.index).toBe(SONG.length - 1)
  })
})

describe('cooldown and breaking the sound', () => {
  it('forces a pause after a hit, during which progress does not grow', () => {
    const engine = engineWith()
    feed(engine, HOLD, 'D5')

    const during = feed(engine, 2, 'E5')
    expect(during.status).toBe('cooldown')
    expect(during.holdProgress).toBe(0)

    const after = feed(engine, HOLD + 1, 'E5')
    expect(after.index).toBe(2)
  })

  it('requires the sound to break between two identical notes', () => {
    const engine = engineWith('wait', ['A5', 'A5', 'B5'])

    feed(engine, HOLD, 'A5')
    feed(engine, COOLDOWN, 'A5')

    // The cooldown is over, but the sound never stopped, so the second A5 does not count.
    const stillHeld = feed(engine, 20, 'A5')
    expect(stillHeld.index).toBe(1)
    expect(stillHeld.status).toBe('release')
    expect(stillHeld.holdProgress).toBe(0)

    // A moment of silence lifts the lock.
    feed(engine, 1, null)
    const second = feed(engine, HOLD, 'A5')
    expect(second.index).toBe(2)
  })

  it('does not lock when the next note is a different one', () => {
    const engine = engineWith('wait', ['A5', 'B5'])

    feed(engine, HOLD, 'A5')
    const snapshot = feed(engine, COOLDOWN + HOLD, 'B5')

    expect(snapshot.finished).toBe(true)
  })
})

describe('mistake bar', () => {
  it('rises on a wrong note and falls on the right one', () => {
    const engine = engineWith()

    const wrong = feed(engine, 4, 'G5')
    expect(wrong.mistakeProgress).toBeCloseTo(0.5)
    expect(wrong.status).toBe('wrong')

    const recovered = feed(engine, 2, 'D5')
    expect(recovered.mistakeProgress).toBe(0)
  })

  it('falls during silence', () => {
    const engine = engineWith()
    feed(engine, 4, 'G5')

    const silent = feed(engine, 4, null)
    expect(silent.mistakeProgress).toBe(0)
    expect(silent.status).toBe('waiting')
  })
})

describe('penalty modes', () => {
  it('"wait" keeps the position and only signals the mistake', () => {
    const engine = engineWith('wait')
    feed(engine, 2, 'E5') // the first note is D5, so E5 is a mistake

    const snapshot = feed(engine, 20, 'E5')
    expect(snapshot.index).toBe(0)
    expect(snapshot.target).toBe('D5')
    expect(snapshot.status).toBe('wrong')
    expect(snapshot.mistakeProgress).toBe(1)
  })

  it('"wait" counts one mistake however long the wrong note is held', () => {
    const engine = engineWith('wait')

    // Half a frame each, so the bar is exactly full on the eighth.
    const filled = feed(engine, 8, 'E5')
    expect(filled.mistakeProgress).toBe(1)
    expect(filled.mistakes).toBe(1)

    // The bar stays pinned at full, crossing the threshold on every frame. Each used to count.
    expect(feed(engine, 60, 'E5').mistakes).toBe(1)
  })

  it('"wait" counts again once the wrong note has stopped in between', () => {
    const engine = engineWith('wait')
    expect(feed(engine, 8, 'E5').mistakes).toBe(1)

    // Silence ends the run and drains the bar below the limit, so refilling it is a new mistake.
    feed(engine, 4, null)
    expect(feed(engine, 8, 'E5').mistakes).toBe(2)
  })

  it('"back" rewinds by the configured number of notes', () => {
    const engine = engineWith('back')
    for (let i = 0; i < 5; i++) playNote(engine)
    expect(engine.snapshot().index).toBe(5)

    const penalised = feed(engine, 8, 'D5') // the sixth note is B5, D5 is wrong
    expect(penalised.index).toBe(2)
    expect(penalised.mistakes).toBe(1)
    expect(penalised.status).toBe('cooldown')
  })

  it('"back" never rewinds past the start of the song', () => {
    const engine = engineWith('back')
    playNote(engine)

    const penalised = feed(engine, 8, 'D6')
    expect(penalised.index).toBe(0)
  })

  it('"restart" returns to the start of the song', () => {
    const engine = engineWith('restart')
    for (let i = 0; i < 4; i++) playNote(engine)
    expect(engine.snapshot().index).toBe(4)

    const penalised = feed(engine, 8, 'D5')
    expect(penalised.index).toBe(0)
    expect(penalised.target).toBe('D5')
  })

  it('requires a break after a penalty, even when the new note is correct', () => {
    const engine = engineWith('restart')
    for (let i = 0; i < 4; i++) playNote(engine)

    // The penalty lands back on D5 while D5 is still sounding, which must not count.
    feed(engine, 8, 'D5')
    const held = feed(engine, 30, 'D5')
    expect(held.index).toBe(0)
    expect(held.status).toBe('release')

    feed(engine, 1, null)
    const restarted = feed(engine, HOLD, 'D5')
    expect(restarted.index).toBe(1)
  })
})

describe('configuration mid-song', () => {
  it('applies a tolerance change from the next frame', () => {
    const engine = engineWith()

    // 40 cents sits outside the configured tolerance of 25.
    expect(feed(engine, 10, 'D5', 40).index).toBe(0)

    engine.configure({ toleranceCents: 50 })
    expect(feed(engine, HOLD, 'D5', 40).index).toBe(1)
  })

  it('applies a penalty mode change without a restart', () => {
    const engine = engineWith('wait')
    for (let i = 0; i < 4; i++) playNote(engine)

    engine.configure({ penaltyMode: 'restart' })
    const penalised = feed(engine, 8, 'D5')
    expect(penalised.index).toBe(0)
  })
})

describe('reset and switching songs', () => {
  it('reset clears progress and statistics', () => {
    const engine = engineWith('back')
    for (let i = 0; i < 3; i++) playNote(engine)
    feed(engine, 8, 'D5')

    const snapshot = engine.reset()
    expect(snapshot.index).toBe(0)
    expect(snapshot.hits).toBe(0)
    expect(snapshot.mistakes).toBe(0)
    expect(snapshot.holdProgress).toBe(0)
    expect(snapshot.mistakeProgress).toBe(0)
    expect(snapshot.finished).toBe(false)
  })

  it('loadSong swaps the song and starts over', () => {
    const engine = engineWith()
    playNote(engine)

    const snapshot = engine.loadSong(['G5', 'A5'])
    expect(snapshot.index).toBe(0)
    expect(snapshot.target).toBe('G5')
    expect(snapshot.total).toBe(2)
    expect(snapshot.hits).toBe(0)
  })
})
