import { TypedEventTarget } from '@/lib/TypedEventTarget'
import * as wakeLock from '@/utils/wake-lock'
import Logger from 'js-logger'

const logger = Logger.get('auto-play')

interface AutoPlayOptions {
  scrollVertical: (distance: number) => void,
  nextPage: () => void,
  speed: number,
  changeHandler: (event: CustomEvent<{ playing: boolean }>) => void,
  turnPageType: TurnPageType,
  requestWakeLock?: boolean
}

const PROGRESS_COUNT = 20

export class AutoPlay extends TypedEventTarget<{
  change: CustomEvent<{ playing: boolean }>,
  progress: CustomEvent<{ progress: number }>
}> {
  static CHANGE_EVENT_NAME = 'change' as const
  static PROGRESS_EVENT_NAME = 'progress' as const

  scrollVertical: (distance: number) => void
  nextPage = () => {}
  speed = 30 // 每秒滚动的像素
  turnPageType: TurnPageType = 'vertical-scroll'

  #interval: ReturnType<typeof setTimeout> | null = null
  #progressInterval: ReturnType<typeof setTimeout> | null = null
  #requestWakeLock: boolean = false

  constructor({ scrollVertical, nextPage, speed, changeHandler, turnPageType, requestWakeLock = !!navigator.wakeLock }: AutoPlayOptions) {
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

  #startProgress() {
    let progress = 0;
    const stepDuration = 300 / this.speed * 1000 / 20
    this.#progressInterval = setInterval(() => {
      progress += (1 / PROGRESS_COUNT)
      this.dispatchEvent(new CustomEvent(AutoPlay.PROGRESS_EVENT_NAME, { detail: { progress } }))
    }, stepDuration)
  }

  start() {
    logger.info('start')
    this.stop()
    if (this.#requestWakeLock) {
      wakeLock.request()
    }
    if (this.turnPageType === 'horizontal-scroll') {
      this.#startProgress()
      this.#interval = setInterval(() => {
        this.dispatchEvent(new CustomEvent(AutoPlay.PROGRESS_EVENT_NAME, { detail: { progress: 1 } }))
        if (this.#progressInterval) {
          clearInterval(this.#progressInterval)
        }
        logger.info('request next page')
        this.nextPage()
        this.#startProgress()
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
    if (this.#progressInterval) { clearInterval(this.#progressInterval) }
    this.#interval = null
    this.#progressInterval = null
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
