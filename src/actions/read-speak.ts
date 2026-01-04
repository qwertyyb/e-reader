import { SegmentAudio, StreamAudioPlayer } from '@/lib/StreamAudioPlayer';
import { Communicate } from 'edge-tts-universal/browser'

export interface TTSAction {
  start(options?: { rate: number }): void | Promise<void | boolean>;
  stop(): void;
  isSpeaking(): boolean;
  toggle(): void;
  updateRate(rate: number): void;
}

export interface TTSActionConstructor {
  new (options: {
    getNextElement: GetNextElement,
    changeHandler: (event: CustomEvent<{ speaking?: boolean, rate?: number }>) => void
  }): TTSAction
}

export type GetNextElement = (current?: HTMLElement) => { nextEl: HTMLElement | null | undefined, scrollIntoView: () => void } | null

export class ReadSpeak extends EventTarget implements TTSAction {
  static CHANGE_EVENT_NAME = 'change'
  #rate = 1
  #uttrProgress = new WeakMap<SpeechSynthesisUtterance, number>()
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
      const left = event.utterance.text.length - event.charIndex
      this.#uttrProgress.set(utter, event.charIndex)
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
      if (!nextTriggered) {
        nextTriggered = true
        this.#readyNext(el)
      }
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
    window.speechSynthesis?.cancel()
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
  updateRate = (newRate: number) => {
    this.#rate = newRate
    if (this.spearkingSSU) {
      this.spearkingSSU.rate = newRate
    }
    if (this.isSpeaking() && this.spearkingSSU && this.#uttrProgress.get(this.spearkingSSU)) {
      // 把剩余的重新说
      window.speechSynthesis.cancel()
      this.spearkingSSU.text = this.spearkingSSU.text.substring(this.#uttrProgress.get(this.spearkingSSU)!)
      window.speechSynthesis.speak(this.spearkingSSU)
    }
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { rate: newRate } }))
  }
}

export class EdgeTTSReadSpeak extends EventTarget implements TTSAction {
  static CHANGE_EVENT_NAME = 'change'
  #rate;
  #audio: StreamAudioPlayer;
  #waitNext: Promise<{ el: HTMLElement, audioUrl: string, scrollIntoView: () => void } | null> | null = null
  speakingEl: HTMLElement | null = null
  generatedEl: HTMLElement | null = null
  

  getNextElement?: GetNextElement
  constructor({ getNextElement, changeHandler }: {
    getNextElement: GetNextElement,
    changeHandler: (event: CustomEvent<{ speaking?: boolean, rate?: number }>) => void
  }) {
    super();
    this.#rate = 1;
    this.speakingEl = null;
    if (typeof getNextElement === 'function') {
      this.getNextElement = getNextElement;
    }
    if (typeof changeHandler === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.addEventListener(EdgeTTSReadSpeak.CHANGE_EVENT_NAME, changeHandler as any);
    }
    this.#audio = new StreamAudioPlayer({
      request: this.requestSegment.bind(this)
    })
    this.#audio.addEventListener('play', () => {
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: true } }))
    })
    this.#audio.addEventListener('pause', () => {
      this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
    })
  }
  #readyNext(current?: HTMLElement) {
    const next = this.getNextElement?.(current);
    if (!next?.nextEl) {
        return;
    }
    const { nextEl: el, scrollIntoView } = next;
    const text = el.innerText || ''

    const communicate = new Communicate(text, { voice: 'zh-CN-XiaoxiaoNeural' })
    return {
      el,
      scrollIntoView,
      communicate,
    }
  }
  requestSegment = () => {
    const info = this.#readyNext(this.generatedEl || undefined)
    if (!info) {
      this.stop();
      throw new Error('no next info')
    }
    const { el, scrollIntoView, communicate } = info;
    this.generatedEl = el
    const seg = new SegmentAudio(async function* (){
      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio') {
          yield chunk.data!.buffer
        }
      }
    })

    seg.addEventListener('start', () => {
      el.classList.add('reading')
      this.speakingEl = el
      scrollIntoView()
    }, { once: true })
    seg.addEventListener('end', () => {
      el.classList.remove('reading')
    }, { once: true })

    return seg;
  }
  async start(options?: { rate: number }) {
    if (options?.rate) {
      this.updateRate(options.rate || 1);
    }
    await this.#audio.play()
    if (("mediaSession" in navigator)) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "EdgeTTS",
        artist: "自动阅读中",
        album: "Edge TTS",
      })
      navigator.mediaSession.setActionHandler("play", () => {
        this.#audio.play()
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        this.#audio.pause()
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        this.#audio.pause()
      });
    }
    return;
  }
  stop() {
    this.speakingEl?.classList.remove('reading');
    this.speakingEl = null;
    this.generatedEl = null;
    this.#audio.pause();
    this.dispatchEvent(new CustomEvent(EdgeTTSReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }));
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null
    }
  }
  toggle() {
    if (this.#audio.paused) {
      return this.start()
    }
    this.stop();
  }
  isSpeaking() {
    return !this.#audio.paused
  }
  updateRate(newRate: number) {
    this.#rate = newRate;
    this.#audio.playbackRate = newRate;
    this.dispatchEvent(new CustomEvent(EdgeTTSReadSpeak.CHANGE_EVENT_NAME, { detail: { rate: newRate } }));
  }
}