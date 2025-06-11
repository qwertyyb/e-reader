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
  return caches.delete(CACHE_NAME)
}

const fetchResources = async () => {
  const resources: string[] = [
    './',
    './index.html',
    './index.html?source=pwa',
    './favicon.ico',
    './manifest.json',
    './sw.js',
    './icons/icon48.png',
    './icons/icon64.png',
    './icons/icon96.png',
    './icons/icon128.png',
    './icons/icon256.png',
    'https://unpkg.com/pwacompat',
    'https://cdn.jsdelivr.net/npm/eruda'
  ]
  const url = new URL('.vite/manifest.json?t=' + Date.now(), location.origin + location.pathname)
  const response = await fetch(url, { cache: 'no-store' })
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
    bridge.invoke('toast', '当前版本已清理')
    const assets = await fetchResources()
    const cache = await caches.open(CACHE_NAME)
    bridge.invoke('toast', '开始下载新版本')
    await cache.addAll(assets)
    bridge.invoke('toast', '已完成版本更新')
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
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  const isRemote = url.searchParams.get('remote') === '1' || url.searchParams.has('_t')
  if (isRemote) return false;
  return true;
}

function randomString(length = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const saveShareFile = async (request: Request) => {
  const formData = await request.formData()
  const file = formData.get('file')
  if (file instanceof File) {
    const cache = await caches.open(CACHE_NAME)
    const fileId = `${randomString()}_${file.name}`
    const url = `./sharedData/${fileId}`
    await cache.put(url, new Response(file, { headers: { 'content-type': file.type, 'content-length': String(file.size) } }))
    return Response.redirect(`./index.html?scene=share&fileUrl=${encodeURIComponent(url)}`, 303)
  }
  throw new Error('Not Found File in Share FormData')
}

const handleShare = (event: FetchEvent) => {
  if (
    event.request.method === 'POST'
    && new URL(event.request.url).searchParams.get('scene') === 'share'
  ) {
    event.respondWith(saveShareFile(event.request))
    return true
  }
  return false
}


self.addEventListener('fetch', function(event) {
  const handled = handleShare(event)
  if (handled) return;
  if (!resourceNeedCache(event.request)) return;
  event.respondWith(
    // 可以简单用 url 字符串做缓存
    caches.match(event.request.url, { cacheName: CACHE_NAME, ignoreVary: true }).then(function(cachedResp) {
      if (cachedResp) {
        logger.info('cache hit', event.request.url)
        return cachedResp
      }
      return fetch(event.request).then(function(response) {
        if (!response.ok) {
          return response
        }
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
