import { env } from "@/utils/env"

export class AutoPlay extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  scrollVertical: (distance: number) => void
  nextPage = () => {}
  speed = 30 // 每秒滚动的像素

  #interval: ReturnType<typeof setTimeout> | null = null

  constructor({ scrollVertical, nextPage, speed, changeHandler }: {
    scrollVertical: (distance: number) => void,
    nextPage: () => void,
    speed: number,
    changeHandler: (event: CustomEvent<{ playing: boolean }>) => void
  }) {
    super()
    this.scrollVertical = scrollVertical
    this.nextPage = nextPage
    this.speed = speed
    if (typeof changeHandler === 'function') {
      this.addEventListener(AutoPlay.CHANGE_EVENT_NAME, changeHandler as EventListenerOrEventListenerObject)
    }
  }

  start() {
    this.stop()
    if (env.isHorizontal()) {
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
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: false } }))
  }

  updateSpeed(s: number) {
    this.speed = s
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
