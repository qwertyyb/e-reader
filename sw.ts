/// <reference lib="WebWorker" />

import { createBridge } from "./src/utils/bridge";

// NOTE: The default context is just Worker and we need to be the more specific ServiceWorker
declare let self: ServiceWorkerGlobalScope

const CACHE_NAME = 'V5';

console.log('self', self)

const logger = {
  info: (...args: Parameters<typeof console.info>) => console.info('[sw]', ...args),
  warn: (...args: Parameters<typeof console.warn>) => console.warn('[sw]', ...args),
  error: (...args: Parameters<typeof console.error>) => console.error('[sw]', ...args),
}

const clearCache = async () => {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

const fetchResources = async () => {
  const resources: string[] = [
    '',
    'index.html',
    'index.html?source=pwa',
    'favicon.ico',
    'manifest.json',
    'version.json',
  ]
  const url = new URL('.vite/manifest.json?t=' + Date.now(), location.origin + location.pathname)
  const response = await fetch(url)
  const json = await response.json()
  return [
    ...resources,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...new Set(Object.values(json).map((item: any) => {
      return [item.file, ...(item.css || []), ...(item.assets || [])]
    }).flat())
  ]
}

const functions = {
  deleteAllCache: clearCache,
  async checkCachedUrls(urls: string[]) {
    const results = await Promise.all(urls.map(async url => {
      const response = await caches.match(url)
      return !!response
    }))
    return urls.reduce((obj, url, index) => ({
      ...obj,
      [url]: results[index]
    }), {})
  },
  async update() {
    await clearCache()
    const assets = await fetchResources()
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(assets)
    return assets
  }
}

const bridge = createBridge(
  (payload) => {
    self.clients.matchAll()
      .then(clients => clients.forEach(client => client.postMessage(payload)));
  },
  (callback) => {
    self.addEventListener('message', event => {
      callback(event.data)
    })
  },
  functions
)
self.addEventListener('install', function(event) {
  logger.info('service worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await clearCache()
        const resources = await fetchResources()
        logger.info('cache resources', resources)
        return cache.addAll(resources);
      })
      .then(() => {
        logger.info('service worker installed')
      })
  )
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  logger.info('active')
  caches.keys().then(function(keyList) {
    return Promise.all(keyList.map(function(key) {
      if (key !== CACHE_NAME) {
        logger.info('delete cache', key)
        return caches.delete(key);
      }
    }));
  })
  event.waitUntil(
    self.clients.claim().then(() => {
      bridge.invoke('toast', '已更新，刷新页面即可使用新版本')
    })
  );
})

const resourceNeedCache = (request: Request) => {
  const url = new URL(request.url);
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  const isRemote = url.searchParams.get('remote') === 'true'
  if (isRemote) return false;
  return true;
}


self.addEventListener('fetch', function(event) {
  if (!event.clientId || !resourceNeedCache(event.request)) return;
  event.respondWith(
    caches.match(event.request, { cacheName: CACHE_NAME }).then(function(cachedResp) {
      if (cachedResp) {
        logger.info('cache hit', event.request.url)
        return cachedResp
      }
      return fetch(event.request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
