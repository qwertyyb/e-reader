export type GetNextElement = (current?: HTMLElement) => { nextEl: HTMLElement | null | undefined, scrollIntoView: () => void } | null

export class ReadSpeak extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'
  #rate = 1
  spearkingSSU: SpeechSynthesisUtterance | null = null
  speakingEl: HTMLElement | null = null

  getNextElement?: GetNextElement

  constructor({ getNextElement, changeHandler }: {
    getNextElement: GetNextElement,
    changeHandler: (event: CustomEvent<{ speaking?: boolean, rate?: number }>) => void
  }) {
    super()
    if (typeof getNextElement === 'function') {
      this.getNextElement = getNextElement
    }
    if (typeof changeHandler === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.addEventListener(ReadSpeak.CHANGE_EVENT_NAME, changeHandler as any)
    }
  }
  #readyNext(current: HTMLElement) {
    const nextEl = this.getNextElement?.(current)
    if (!nextEl?.nextEl) return
    const utterance = this.#createUtterance(nextEl)!
    window.speechSynthesis.speak(utterance)
  }
  #createUtterance(next?: ReturnType<GetNextElement>) {
    if (!next?.nextEl) {
      this.stop()
      return;
    }
    const { nextEl: el, scrollIntoView } = next
    const utter = new SpeechSynthesisUtterance(el.textContent || '');
    utter.rate = this.#rate
    let nextTriggered = false
    utter.addEventListener('boundary', event => {
      const left = event.charLength || event.utterance.text.length - event.charIndex
      if (left <= 10 && !nextTriggered) {
        nextTriggered = true
        this.#readyNext(el)
      }
    })
    utter.addEventListener('resume', () => {
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
    })
    utter.addEventListener('start', () => {
      el.classList.add('reading')
      this.speakingEl = el
      scrollIntoView()
      this.spearkingSSU = utter
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: true } }))
    })
    utter.addEventListener('end', () => {
      el.classList.remove('reading')
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: true } }))
    })
    utter.addEventListener('pause', () => {
      el.classList.remove('reading')
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
    })
    return utter
  }
  start(options?: { rate: number }) {
    if (options?.rate) {
      this.updateRate(options.rate || 1)
    }
    const utterance = this.#createUtterance(this.getNextElement?.())
    if (utterance) {
      window.speechSynthesis.speak(utterance)
    }
  }
  stop() {
    window.speechSynthesis.cancel()
    this.spearkingSSU = null
    this.speakingEl?.classList.remove('reading')
    this.speakingEl = null
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
  }
  toggle() {
    if (window.speechSynthesis.speaking) {
      return this.stop()
    }
    this.start()
  }
  isSpeaking() {
    return window.speechSynthesis.speaking
  }
  updateRate(newRate: number) {
    this.#rate = newRate
    if (this.spearkingSSU) {
      this.spearkingSSU.rate = newRate
    }
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { rate: newRate } }))
  }
}
