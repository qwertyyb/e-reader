import Logger from "js-logger"

const logger = Logger.get('wake-lock')

let wakeLockSentinel: WakeLockSentinel | null = null

const visibilityChangeHandler = async () => {
  logger.info('visibilityChangeHandler')
  if (document.visibilityState == 'visible') {
    logger.info('visibilityChangeHandler requestWakeLock')
    wakeLockSentinel = await navigator.wakeLock.request('screen')
  }
}

const request = async () => {
  logger.info('request')
  if (wakeLockSentinel && !wakeLockSentinel.released) return
  wakeLockSentinel = await navigator.wakeLock.request('screen')
  // 当页面不可见时，会自动释放唤醒锁，所以可见时需要重新获取
  document.addEventListener('visibilitychange', visibilityChangeHandler)
  return wakeLockSentinel
}
const release = () => {
  logger.info('release')
  document.removeEventListener('visibilitychange', visibilityChangeHandler)
  wakeLockSentinel?.release()
}

export { request, release }