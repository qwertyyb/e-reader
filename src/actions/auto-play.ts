import { env } from "@/utils/env"

export class AutoPlay extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  scrollVertical = () => {}
  nextPage = () => {}
  autoPlayDuration = 24

  #interval: ReturnType<typeof setTimeout> | null = null

  constructor({ scrollVertical, nextPage, autoPlayDuration, changeHandler }: {
    scrollVertical: () => void,
    nextPage: () => void,
    autoPlayDuration: number,
    changeHandler: (event: CustomEvent<{ playing: boolean }>) => void
  }) {
    super()
    this.scrollVertical = scrollVertical
    this.nextPage = nextPage
    this.autoPlayDuration = autoPlayDuration
    if (typeof changeHandler === 'function') {
      this.addEventListener(AutoPlay.CHANGE_EVENT_NAME, changeHandler as EventListenerOrEventListenerObject)
    }
  }

  start() {
    this.stop()
    if (env.isHorizontal()) {
      this.#interval = setInterval(() => {
        this.nextPage()
      }, this.autoPlayDuration * 1000)
    } else {
      this.#interval = setInterval(() => {
        this.scrollVertical()
      }, this.autoPlayDuration)
    }
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: true } }))
  }

  stop() {
    if (this.#interval) { clearInterval(this.#interval) }
    this.#interval = null
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: false } }))
  }

  updateInterval(s: number) {
    this.autoPlayDuration = s
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
