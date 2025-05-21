import Logger from 'js-logger'

const logger = Logger.get('auto-play')

export class AutoPlay extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  scrollVertical: (distance: number) => void
  nextPage = () => {}
  speed = 30 // 每秒滚动的像素
  turnPageType: TurnPageType = 'vertical-scroll'

  #interval: ReturnType<typeof setTimeout> | null = null
  #requestWakeLock: boolean = false
  #wakeSentinel: WakeLockSentinel | null = null

  constructor({ scrollVertical, nextPage, speed, changeHandler, turnPageType, requestWakeLock = !!navigator.wakeLock }: {
    scrollVertical: (distance: number) => void,
    nextPage: () => void,
    speed: number,
    changeHandler: (event: CustomEvent<{ playing: boolean }>) => void,
    turnPageType: TurnPageType,
    requestWakeLock?: boolean,
  }) {
    super()
    this.scrollVertical = scrollVertical
    this.nextPage = nextPage
    this.speed = speed
    this.turnPageType = turnPageType
    this.#requestWakeLock = requestWakeLock
    if (typeof changeHandler === 'function') {
      this.addEventListener(AutoPlay.CHANGE_EVENT_NAME, changeHandler as EventListenerOrEventListenerObject)
    }
  }

  start() {
    this.stop()
    if (this.#requestWakeLock) {
      this.requestWakeLock()
    }
    if (this.turnPageType === 'horizontal-scroll') {
      this.#interval = setInterval(() => {
        this.nextPage()
      }, 300 / this.speed * 1000)
    } else {
      this.#interval = setInterval(() => {
        this.scrollVertical(this.speed / (1000 / 16))
      }, 10)
    }
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: true } }))
  }

  stop() {
    if (this.#interval) { clearInterval(this.#interval) }
    this.#interval = null
    this.releaseWakeLock()
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: false } }))
  }

  updateSpeed(s: number) {
    this.speed = s
    if (this.isPlaying()) {
      this.start()
    }
  }

  updateTurnPageType(t: TurnPageType) {
    this.turnPageType = t
    if (this.isPlaying()) {
      this.start()
    }
  }

  #visibilityChangeHandler() {
    logger.info('visibilityChangeHandler')
    if (this.isPlaying() && this.#requestWakeLock && document.visibilityState == 'visible') {
      logger.info('visibilityChangeHandler requestWakeLock')
      navigator.wakeLock.request('screen')
          .then(value => this.#wakeSentinel = value)
    }
  }

  requestWakeLock() {
    logger.info('requestWakeLock')
    if (this.#wakeSentinel?.released || !this.#wakeSentinel) {
      navigator.wakeLock.request('screen')
          .then(value => this.#wakeSentinel = value)
      // 当页面不可见时，会自动释放唤醒锁，所以可见时需要重新获取
      document.addEventListener('visibilitychange', this.#visibilityChangeHandler)
    } else {
      logger.warn('requestWakeLock', '已锁定，无须再次获取锁')
    }
  }

  releaseWakeLock() {
    logger.info('releaseWakeLock')
    if (!this.#wakeSentinel || this.#wakeSentinel?.released) {
      logger.warn('releaseWakeLock', '未锁定或已释放锁，无须再次释放')
      return
    }
    this.#wakeSentinel?.release()
    document.removeEventListener('visibilitychange', this.#visibilityChangeHandler)
  }

  updateRequestWakeLock(request: boolean) {
    if (this.#requestWakeLock === request) return;
    this.#requestWakeLock = request
    if (this.#requestWakeLock) {
      this.releaseWakeLock()
    } else {
      this.releaseWakeLock()
    }
  }

  toggle() {
    if (this.isPlaying()) {
      return this.stop()
    }
    this.start()
  }

  isPlaying() {
    return !!this.#interval
  }
}
