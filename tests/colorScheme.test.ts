import { COLOR_SCHEME_KEY, colorSchemeManager } from '../src/colorScheme'

/** Enough of the `Storage` interface for the manager, which only ever gets, sets and removes. */
function fakeStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value) },
    removeItem: (key) => { entries.delete(key) },
    clear: () => { entries.clear() },
    key: (index) => [...entries.keys()][index] ?? null,
    get length() { return entries.size },
  }
}

// The environment is `node`, so neither storage exists until a test puts one there.
const globals = globalThis as { sessionStorage?: Storage, localStorage?: Storage }

afterEach(() => {
  delete globals.sessionStorage
  delete globals.localStorage
})

describe('colorSchemeManager', () => {
  it('falls back to the default when nothing has been chosen', () => {
    globals.sessionStorage = fakeStorage()
    expect(colorSchemeManager.get('auto')).toBe('auto')
  })

  it('remembers a choice for the session and forgets it on clear', () => {
    globals.sessionStorage = fakeStorage()

    colorSchemeManager.set('light')
    expect(colorSchemeManager.get('auto')).toBe('light')

    colorSchemeManager.clear()
    expect(colorSchemeManager.get('auto')).toBe('auto')
  })

  // The point of the whole file: a scheme kept in `localStorage` is a scheme pinned for good, and
  // then the app opens on last night's choice instead of following the device.
  it('keeps the override out of localStorage', () => {
    const session = fakeStorage()
    const local = fakeStorage()
    globals.sessionStorage = session
    globals.localStorage = local

    colorSchemeManager.set('dark')

    expect(session.getItem(COLOR_SCHEME_KEY)).toBe('dark')
    expect(local.length).toBe(0)
  })

  // Storage throws outright when cookies are blocked, and there is none at all while server
  // rendering. Neither is a reason for the app not to come up.
  it('survives having no storage at all', () => {
    expect(colorSchemeManager.get('auto')).toBe('auto')
    expect(() => { colorSchemeManager.set('dark') }).not.toThrow()
    expect(() => { colorSchemeManager.clear() }).not.toThrow()
  })
})
