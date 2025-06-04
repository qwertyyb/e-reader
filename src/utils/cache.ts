import Logger from "js-logger"

const logger = Logger.get('cache')

let cachePromise: Promise<Cache> | undefined = window.caches?.open('e-reader')

export const getCache = <T>(key: string): Promise<T | null | undefined> | undefined => {
  return cachePromise?.then(cache => cache.match(key))
    .then(r => r?.json())
    .catch(err => {
      logger.error(`cache.get ${key} error`, err)
      return null
    })
}

export const setCache = <T>(key: string, data: T): Promise<void | false> | undefined => {
  return cachePromise?.then(cache => cache.put(key, new Response(JSON.stringify(data))))
    .catch(err => {
      logger.error(`cache.set ${key} error`, data, err)
      return false
    })
}

export const clearAllCache = async () => {
  if (!window.caches) return;
  const keys = await window.caches.keys()
  await Promise.all(keys.map(key => window.caches.delete(key)))
  cachePromise = window.caches?.open('e-reader')
}
