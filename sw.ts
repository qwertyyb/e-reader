/// <reference lib="WebWorker" />

import { createBridge } from "./src/utils/bridge";

// NOTE: The default context is just Worker and we need to be the more specific ServiceWorker
declare let self: ServiceWorkerGlobalScope

const CACHE_NAME = 'v4';

console.log('self', self)

const logger = {
  info: (...args: Parameters<typeof console.info>) => console.info('[sw]', ...args),
  warn: (...args: Parameters<typeof console.warn>) => console.warn('[sw]', ...args),
  error: (...args: Parameters<typeof console.error>) => console.error('[sw]', ...args),
}


const resources: string[] = [
  self.origin + '/e-reader/version.json'
]

const functions = {
  async deleteAllCache() {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    (await caches.open(CACHE_NAME)).addAll(resources)
  },
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
  async checkUpdates() {
    const updateUrl = self.origin + '/e-reader/version.json'
    logger.info('checkUpdates', updateUrl)
    const cachedResponse = await caches.match(updateUrl)
    const localVersion = (await cachedResponse?.json())?.version
    const response = await fetch(updateUrl + '?t=' + Date.now())
    const version = (await response.json()).version
    logger.info('checkUpdates', version, localVersion)
    if (version && version !== localVersion) {
      return {
        hasUpdates: true,
        version,
        changelog: ''
      }
    }
    return {
      hasUpdates: false,
      version: localVersion,
    }
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
      .then(cache => {
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
  if (!url.protocol.startsWith('http')) return false
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  return true;
}


self.addEventListener('fetch', function(event) {
  if (!event.clientId || !resourceNeedCache(event.request)) return;
  logger.info('fetch', event.request.url)
  event.respondWith(
    self.clients.get(event.clientId)
      .then(client => {
        const disableCache = client?.url.includes('cache=0') ?? true
        if (disableCache) return fetch(event.request);
        return caches.match(event.request).then(function(cachedResp) {
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
      })
  );
});
