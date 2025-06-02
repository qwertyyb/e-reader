export class ReadingTime extends EventTarget {

  #changeHandler?: (time: number) => void
  #time = 0 // 秒
  #checkReadingTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(initialTime: number, changeHandler: (time: number) => void) {
    super()
    this.#time = initialTime
    this.#changeHandler = changeHandler
    this.addEventListener('change', this.onChange)
    this.start()
  }

  private onChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ time: number }>
    this.#changeHandler?.(customEvent.detail.time)
  }

  checkIsReading = () => {
    if (!document.hidden) {
      this.#time += 1
      this.dispatchEvent(new CustomEvent('change', { detail: { time: this.#time } }))
    }
    this.#checkReadingTimeout = setTimeout(this.checkIsReading, 1000)
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