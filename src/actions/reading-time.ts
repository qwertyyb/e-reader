export class ReadingTime extends EventTarget {

  #changeHandler?: (time: number, delta: number) => void
  #time = 0 // 秒
  #checkReadingTimeout: ReturnType<typeof setTimeout> | null = null
  #checkInterval = 1000

  constructor(changeHandler: (time: number, delta: number) => void) {
    super()
    this.#changeHandler = changeHandler
    this.addEventListener('change', this.onChange)
    this.start()
  }

  private onChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ time: number }>
    this.#changeHandler?.(customEvent.detail.time, Math.round(this.#checkInterval / 1000))
  }

  checkIsReading = () => {
    if (!document.hidden) {
      this.#time += 1
      this.dispatchEvent(new CustomEvent('change', { detail: { time: this.#time } }))
    }
    this.#checkReadingTimeout = setTimeout(this.checkIsReading, this.#checkInterval)
  }

  start = () => {
    this.checkIsReading()
  }

  destroy = () => {
    if (this.#checkReadingTimeout) {
      clearTimeout(this.#checkReadingTimeout)
    }
    this.removeEventListener('change', this.onChange)
  }
}
