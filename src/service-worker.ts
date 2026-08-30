import { manifest, version } from '@parcel/service-worker'

/**
 * Offline cache.
 *
 * The trainer is a good candidate for it: there is no backend at all. Pitch
 * detection runs in the page, songs and fingerings are compiled into the bundle,
 * and settings live in localStorage — so once the four files are on disk the app
 * has nothing left to ask the network for, and a recorder lesson works on a train.
 *
 * `manifest` and `version` are filled in at build time by Parcel's service worker
 * runtime: the manifest is every bundle's URL, and the version changes whenever
 * any of them does. Naming the cache after the version is what makes an update
 * atomic — a new build writes a new cache and the old one is dropped whole, so
 * the page can never end up running one build's JavaScript against another's CSS.
 */

// The service worker's `self` is not the plain `WorkerGlobalScope` that the
// WebWorker lib declares, and there is no lib that narrows it. See
// tsconfig.worker.json for why this file is typechecked on its own.
declare const self: ServiceWorkerGlobalScope

const CACHE = `flutex-${version}`

/**
 * The document, resolved the same way `cache.addAll` resolved it. It is the one
 * entry whose name carries no content hash, so it has to be looked up by shape
 * rather than by URL.
 */
const DOCUMENT = manifest.find((url) => url.endsWith('.html')) ?? './index.html'

async function precache(): Promise<void> {
  const cache = await caches.open(CACHE)
  await cache.addAll(manifest)

  // Without this the new worker waits for every tab to close, which for a page
  // people leave open next to their sheet music can be days. Taking over early
  // is safe here because nothing is fetched lazily: the page holds no reference
  // to a bundle that the swap could pull out from under it.
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

  // The document is the only file whose name never changes, so it is the only
  // one a cache can serve stale: a deploy that edits nothing but index.html
  // leaves every hashed asset — and therefore this worker — byte-identical, and
  // no update is triggered at all. Asking the network first costs 600 bytes and
  // closes that hole, while the cached copy still answers when there is no
  // network, which is the whole point of the file.
  //
  // The fresh copy is deliberately not written back. It belongs to a build whose
  // bundles are precached under a different version, and mixing the two
  // generations in one cache is exactly the failure the versioned name prevents.
  if (request.mode === 'navigate') {
    return (await fromNetwork(request))
      ?? (await cache.match(DOCUMENT))
      ?? new Response('Flutex is offline and has nothing cached yet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
  }

  // Everything else is content-hashed, so a hit cannot be out of date: a changed
  // file arrives under a changed name and misses.
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
  // Only plain reads are answerable from a cache, and with no backend there is
  // nothing else to intercept — anything unhandled falls through to the browser.
  if (event.request.method !== 'GET') return

  event.respondWith(respond(event.request))
})
