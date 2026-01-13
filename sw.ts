/// <reference lib="WebWorker" />

import { createBridge } from "./src/utils/bridge";

// NOTE: The default context is just Worker and we need to be the more specific ServiceWorker
declare let self: ServiceWorkerGlobalScope

const CACHE_NAME = 'V5';
// 保留最近的一个版本，方便出问题后回滚
const keepVersions = 1;
const versionCachePrefix = 'version-'

console.log('self', self)

const logger = {
  info: (...args: Parameters<typeof console.info>) => console.info('[sw]', ...args),
  warn: (...args: Parameters<typeof console.warn>) => console.warn('[sw]', ...args),
  error: (...args: Parameters<typeof console.error>) => console.error('[sw]', ...args),
}

interface IResource {
  path: string
  integrity: string
}

const fetchVersionInfo = async () => {
  const resources: IResource[] = [
    'https://unpkg.com/pwacompat',
    'https://cdn.jsdelivr.net/npm/eruda'
  ].map(item => ({ path: item, integrity: '' }))
  const url = new URL('releases.json?t=' + Date.now(), location.origin + location.pathname)
  const response = await fetch(url, { cache: 'no-store' })
  const json = await response.json()
  const release = json.releases[0]
  if (!release) {
    throw new Error('No release found')
  }
  if (!release.buildVersion) {
    throw new Error('No build version found')
  }
  if (!release.assets?.length) {
    throw new Error('No assets found')
  }
  return {
    buildVersion: release.buildVersion,
    assets: [
      ...resources,
      ...release.assets
    ]
  }
}

const deleteOutdateCache = async () => {
  const cacheNames = await caches.keys()
  const needDeleteVersionCacheNames = cacheNames.filter(name => name.startsWith(versionCachePrefix)).sort((prev, next) => next.localeCompare(prev)).slice(keepVersions + 1)
  console.log('needDeleteVersionCacheNames', needDeleteVersionCacheNames, cacheNames)
  const deleteResults = await Promise.all(needDeleteVersionCacheNames.map(name => caches.delete(name)))
  console.log('deleteResults', deleteResults)
  return deleteResults
}

const cacheResources = async () => {
  const { buildVersion, assets } = await fetchVersionInfo()
  const cacheName = `${versionCachePrefix}${buildVersion}`
  try {
    const cache = await caches.open(cacheName)
    console.log(assets)
    bridge.invoke('toast', '开始下载新版本')
    await cache.addAll(assets.map(item => {
      return new Request(item.path, { integrity: item.integrity })
    }))
    await deleteOutdateCache()
  } catch (err) {
    // 缓存出错，删除未完成的缓存
    caches.delete(cacheName)
    throw err
  }
}

const functions = {
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
    bridge.invoke('toast', '开始下载新版本')
    await cacheResources()
    bridge.invoke('toast', '已完成版本更新')
  }
}

const bridge = createBridge(
  (payload) => {
    self.clients.matchAll()
      .then(clients => clients.forEach(client => client.postMessage(payload)));
  },
  (callback) => {
    self.addEventListener('message', event => {
      event.waitUntil(Promise.resolve(callback(event.data)))
    })
  },
  functions
)


self.addEventListener('install', function(event) {
  logger.info('service worker installing...', self.registration.active)
  // 首次安装，缓存资源
  event.waitUntil(Promise.all([cacheResources(), self.skipWaiting()]))
});

self.addEventListener('activate', event => {
  logger.info('active')
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

const getCacheName = async () => {
  return caches.keys().then(names => {
    const versionNames = names.filter(name => name.startsWith(versionCachePrefix)).sort((prev, next) => next.localeCompare(prev))
    return versionNames[0]
  })
}

self.addEventListener('fetch', function(event) {
  const handled = handleShare(event)
  if (handled) return;
  if (!resourceNeedCache(event.request)) return;
  event.respondWith(
    getCacheName().then(cacheName => {
      if (!cacheName) return this.fetch(event.request)
      // 可以简单用 url 字符串做缓存
      return caches.match(event.request.url, { cacheName, ignoreVary: true }).then(function(cachedResp) {
        if (cachedResp) {
          logger.info('cache hit', event.request.url)
          return cachedResp
        }
        return fetch(event.request).then(function(response) {
          if (!response.ok) {
            return response
          }
          return caches.open(cacheName).then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    })
  )
});
