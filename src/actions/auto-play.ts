import { TypedEventTarget } from '@/lib/TypedEventTarget'
import * as wakeLock from '@/utils/wake-lock'
import Logger from 'js-logger'

const logger = Logger.get('auto-play')

export class AutoPlay extends TypedEventTarget<{ change: CustomEvent<{ playing: boolean }> }> {
  static CHANGE_EVENT_NAME = 'change' as const

  scrollVertical: (distance: number) => void
  nextPage = () => {}
  speed = 30 // 每秒滚动的像素
  turnPageType: TurnPageType = 'vertical-scroll'

  #interval: ReturnType<typeof setTimeout> | null = null
  #requestWakeLock: boolean = false

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
      this.addEventListener(AutoPlay.CHANGE_EVENT_NAME, changeHandler)
    }
  }

  start() {
    logger.info('start')
    this.stop()
    if (this.#requestWakeLock) {
      wakeLock.request()
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
    logger.info('stop')
    if (this.#interval) { clearInterval(this.#interval) }
    this.#interval = null
    wakeLock.release()
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: false } }))
  }

  updateSpeed(s: number) {
    logger.info('updateSpeed', s)
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
