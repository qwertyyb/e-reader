import Logger from "js-logger"

const logger = Logger.get('cache')

const cachePromise = window.caches?.open('e-book')

export const getCache = <T>(key: string): Promise<T | null | undefined> => {
  return cachePromise.then(cache => cache.match(key))
    .then(r => r?.json())
    .catch(err => {
      logger.error(`cache.get ${key} error`, err)
      return null
    })
}

export const setCache = <T>(key: string, data: T): Promise<void | false> => {
  return cachePromise.then(cache => cache.put(key, new Response(JSON.stringify(data))))
    .catch(err => {
      logger.error(`cache.set ${key} error`, data, err)
      return false
    })
}