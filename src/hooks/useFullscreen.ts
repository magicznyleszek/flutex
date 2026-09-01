import { useCallback, useSyncExternalStore } from 'react'

/** The prefixed Fullscreen API that Safari answers to, absent from the DOM typings. */
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
   * False on an iPhone, where Safari only lets a <video> go fullscreen, and false in an
   * installed PWA, which has no browser chrome left to hide.
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

  // Not `(display-mode: fullscreen)`: element fullscreen matches that too, hiding the way back out.
  const installed = window.matchMedia('(display-mode: standalone)').matches

  return supported && !installed
}

const subscribe = (onChange: () => void): (() => void) => {
  document.addEventListener('fullscreenchange', onChange)
  document.addEventListener('webkitfullscreenchange', onChange)
  return () => {
    document.removeEventListener('fullscreenchange', onChange)
    document.removeEventListener('webkitfullscreenchange', onChange)
  }
}

const subscribeNothing = (): (() => void) => () => undefined

const off = (): boolean => false

export function useFullscreen(): Fullscreen {
  // The third argument keeps these working in the render tests, which have no `window`.
  const available = useSyncExternalStore(subscribeNothing, detect, off)
  const active = useSyncExternalStore(subscribe, isActive, off)

  const toggle = useCallback(() => {
    const doc = webkitDoc()

    // A rejection is normal: the browser refuses when the gesture does not count.
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
