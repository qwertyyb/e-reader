export class ReadSpeak extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'
  getNextElement?: (current: HTMLElement) => HTMLElement | null

  constructor({ getNextElement, changeHandler }: {
    getNextElement: (current: HTMLElement) => HTMLElement | null,
    changeHandler: (event: CustomEvent<{ speaking: boolean }>) => void
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
    if (!nextEl) return
    const utterance = this.#createUtterance(nextEl)
    window.speechSynthesis.speak(utterance)
  }
  #createUtterance(el: HTMLElement) {
    const utter = new SpeechSynthesisUtterance(el.textContent || '');
    let nextTriggered = false
    utter.addEventListener('boundary', event => {
      if (event.charIndex > event.utterance.text.length - 10 && !nextTriggered) {
        nextTriggered = true
        this.#readyNext(el)
      }
    })
    utter.addEventListener('resume', () => {
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
    })
    utter.addEventListener('start', () => {
      el.classList.add('reading')
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
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
  start(el: HTMLElement) {
    const utterance = this.#createUtterance(el)
    window.speechSynthesis.speak(utterance)
  }
  stop() {
    window.speechSynthesis.cancel()
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
  }
  toggle(el?: HTMLElement | null) {
    if (window.speechSynthesis.speaking) {
      return this.stop()
    }
    if (!el) return;
    this.start(el)
  }
  isSpeaking() {
    return window.speechSynthesis.speaking
  }
}
