import { useCallback, useSyncExternalStore } from 'react'

/**
 * The prefixed half of the Fullscreen API, which Safari still answers to and which
 * nothing in the DOM typings knows about. Every member is optional because these
 * are exactly the names that may be missing.
 */
interface WebkitDocument {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

interface WebkitElement {
  webkitRequestFullscreen?: () => Promise<void>
}

export interface Fullscreen {
  /**
   * Whether offering the control makes any sense. False on an iPhone, where Safari
   * has never allowed an element to go fullscreen — only a <video> — and false in
   * an installed PWA, which has no browser chrome left to hide.
   */
  available: boolean
  active: boolean
  toggle: () => void
}

const webkitDoc = (): Document & WebkitDocument => document

const isActive = (): boolean => {
  const doc = webkitDoc()
  return doc.fullscreenElement !== null || (doc.webkitFullscreenElement ?? null) !== null
}

const detect = (): boolean => {
  const doc = webkitDoc()
  const supported = doc.fullscreenEnabled || (doc.webkitFullscreenEnabled ?? false)

  // `standalone` alone, which is what the manifest asks for, and deliberately not
  // `(display-mode: fullscreen)`: that also matches while *this* toggle is holding
  // the document fullscreen, so including it hid the button at the one moment it
  // was needed to get back out.
  const installed = window.matchMedia('(display-mode: standalone)').matches

  return supported && !installed
}

/** Both event names, because the event is prefixed wherever the methods are. */
const subscribe = (onChange: () => void): (() => void) => {
  document.addEventListener('fullscreenchange', onChange)
  document.addEventListener('webkitfullscreenchange', onChange)
  return () => {
    document.removeEventListener('fullscreenchange', onChange)
    document.removeEventListener('webkitfullscreenchange', onChange)
  }
}

/** Whether the browser can do it never changes, so nothing has to be watched. */
const subscribeNothing = (): (() => void) => () => undefined

const off = (): boolean => false

/**
 * Fullscreen, as a toggle that knows when not to offer itself.
 *
 * The trainer's whole first screen fits a phone by design, but on a 390x844 handset
 * the browser keeps roughly 180px of that for its own toolbars. Reclaiming them is
 * worth more than any further tightening of the layout — which is also why this can
 * only ever be a complement to the layout work and never a substitute for it: the
 * button itself has to be reachable before it can be pressed, since the API only
 * grants the request from inside a user gesture.
 */
export function useFullscreen(): Fullscreen {
  // Both values are reads of the platform, not React state, so they come through
  // useSyncExternalStore. The third argument is what makes this work in a static
  // render, where the app is asserted to come up with no `window` and no
  // `document` at all: `off` is used instead of the snapshot, and it happens to be
  // the truthful answer there too, since a static render has no browser chrome to
  // hide. Reading the DOM in an effect and calling setState would be the same
  // thing with an extra render and a lint error.
  const available = useSyncExternalStore(subscribeNothing, detect, off)
  const active = useSyncExternalStore(subscribe, isActive, off)

  const toggle = useCallback(() => {
    const doc = webkitDoc()

    // A rejection here is normal — the browser refuses whenever it decides the
    // gesture does not count — and there is nothing to report: the screen simply
    // stays as it was, and the next tap is free to try again.
    if (isActive()) {
      const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc)
      void exit?.().catch(() => undefined)
      return
    }

    const target: Element & WebkitElement = document.documentElement
    const request = target.requestFullscreen?.bind(target)
      ?? target.webkitRequestFullscreen?.bind(target)
    void request?.().catch(() => undefined)
  }, [])

  return { available, active, toggle }
}
