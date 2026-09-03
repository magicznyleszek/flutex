import { manifest, version } from '@parcel/service-worker'

/** Offline cache. Nothing here talks to a backend, so a cached build needs no network at all. */

// No TypeScript lib narrows a service worker's global scope, hence the redeclaration and the separate
// tsconfig.worker.json.
declare const self: ServiceWorkerGlobalScope

/**
 * Parcel's `version` changes whenever any bundle does, so each build fills a new cache and the old one is
 * dropped whole. One build's JavaScript can never run against another's CSS.
 */
const CACHE = `flutex-${version}`

/** The one manifest entry with no content hash, so it is matched by extension, not by URL. */
const DOCUMENT = manifest.find((url) => url.endsWith('.html')) ?? './index.html'

async function precache(): Promise<void> {
  const cache = await caches.open(CACHE)
  await cache.addAll(manifest)

  // Nothing is fetched lazily, so taking over now cannot pull a bundle out from under an open page.
  await self.skipWaiting()
}

async function dropOldCaches(): Promise<void> {
  const names = await caches.keys()
  await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
  await self.clients.claim()
}

/** `fetch` rejects when there is no network; the caller wants that as a miss. */
async function fromNetwork(request: Request): Promise<Response | null> {
  try {
    return await fetch(request)
  } catch {
    return null
  }
}

async function respond(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE)

  // Network first for the document: index.html is the only unhashed name, so a deploy that changes nothing
  // else fires no worker update. The cache still answers offline. The fresh copy is not written back — it
  // belongs to a build precached under another version.
  if (request.mode === 'navigate') {
    return (await fromNetwork(request))
      ?? (await cache.match(DOCUMENT))
      ?? new Response('Flutex is offline and has nothing cached yet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
  }

  // Everything else is content-hashed, so a hit cannot be stale: a changed file misses.
  const hit = await cache.match(request)
  if (hit) return hit

  const fresh = await fromNetwork(request)
  return fresh ?? Response.error()
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(dropOldCaches())
})

self.addEventListener('fetch', (event) => {
  // With no backend, plain reads are the only thing worth intercepting.
  if (event.request.method !== 'GET') return

  event.respondWith(respond(event.request))
})
