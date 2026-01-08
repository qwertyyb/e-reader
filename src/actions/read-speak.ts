import { SegmentAudio, StreamAudioPlayer } from '@/lib/StreamAudioPlayer';
import { isNativeSpeaking, NativeSpeechSynthesisUtterance, nativeSpeak, nativeStop } from '@/platform/tts';
import { Capacitor } from '@capacitor/core';
import { Communicate } from 'edge-tts-universal/browser'
import Logger from 'js-logger';

const logger = Logger.get('read-speak')

const isApp = ['android', 'ios'].includes(Capacitor.getPlatform())

const speak = (utter: NativeSpeechSynthesisUtterance | SpeechSynthesisUtterance) => {
  if (isApp) {
    return nativeSpeak(utter)
  }
  return window.speechSynthesis?.speak(utter as SpeechSynthesisUtterance)
}

const stop = () => {
  if (isApp) {
    return nativeStop()
  }
  window.speechSynthesis?.cancel()
}

const isSpeaking = () => {
  if (isApp) {
    return isNativeSpeaking()
  }
  return window.speechSynthesis?.speaking
}

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

export const SILENCE_DATA =
  'data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

export class ReadSpeak extends EventTarget implements TTSAction {
  static CHANGE_EVENT_NAME = 'change'
  #rate = 1
  #uttrProgress = new WeakMap<SpeechSynthesisUtterance | NativeSpeechSynthesisUtterance, number>()
  #backgroundAudio: HTMLAudioElement | null = null
  spearkingSSU: SpeechSynthesisUtterance | NativeSpeechSynthesisUtterance | null = null
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
    speak(utterance)
  }
  #createUtterance(next?: ReturnType<GetNextElement>) {
    if (!next?.nextEl) {
      this.stop()
      return;
    }
    const { nextEl: el, scrollIntoView } = next
    const utter = (isApp
      ? new NativeSpeechSynthesisUtterance(el.textContent || '')
      : new SpeechSynthesisUtterance(el.textContent || '')) as SpeechSynthesisUtterance
    utter.rate = this.#rate
    console.log(utter, this.#rate)
    let nextTriggered = false
    utter.addEventListener('boundary', event => {
      const left = event.utterance.text.length - event.charIndex
      this.#uttrProgress.set(utter, left)
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
  #createBackgroundAudio = () => {
    // 启动一个背景音频，防止在页面进入后台后，无法继续播放
    if (this.#backgroundAudio) return;
    this.#backgroundAudio = document.createElement('audio');
    this.#backgroundAudio.setAttribute('x-webkit-airplay', 'deny');
    this.#backgroundAudio.addEventListener('play', () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
    });
    this.#backgroundAudio.preload = 'auto';
    this.#backgroundAudio.loop = true;
    this.#backgroundAudio.src = SILENCE_DATA;
    this.#backgroundAudio.play();
  };
  #destroyAudio = () => {
    if (!this.#backgroundAudio) return;
    try {
      this.#backgroundAudio.pause();
      this.#backgroundAudio.currentTime = 0;
      this.#backgroundAudio.removeAttribute('src');
      this.#backgroundAudio.src = '';
      this.#backgroundAudio.load();
      this.#backgroundAudio = null;
    } catch (err) {
      logger.error('Error releasing unblock audio:', err);
    }
  };
  #updateMediaSession = () => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: '自动朗读中',
      artist: 'EdgeTTS',
      album: 'hello',
      artwork: [
        {
          src: './books/covers/asjct.jpeg',
        },
      ],
    });
  }
  #removeMediaSession = () => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = null;
  }

  start(options?: { rate: number }) {
    if (options?.rate) {
      this.updateRate(options.rate || 1)
    }
    const utterance = this.#createUtterance(this.getNextElement?.())
    if (utterance) {
      speak(utterance)
      this.#createBackgroundAudio()
      this.#updateMediaSession()
    }
  }
  stop() {
    stop()
    this.spearkingSSU = null
    this.speakingEl?.classList.remove('reading')
    this.speakingEl = null
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { speaking: false } }))
    this.#destroyAudio()
    this.#removeMediaSession()
  }
  toggle = () => {
    if (this.isSpeaking()) {
      return this.stop()
    }
    this.start()
  }
  isSpeaking() {
    return isSpeaking()
  }
  updateRate = async (newRate: number) => {
    this.#rate = newRate
    if (this.spearkingSSU) {
      this.spearkingSSU.rate = newRate
    }
    if (this.isSpeaking() && this.spearkingSSU && this.#uttrProgress.get(this.spearkingSSU)) {
      // 把剩余的重新说
      await stop()
      this.spearkingSSU.text = this.spearkingSSU.text.substring(this.spearkingSSU.text.length - this.#uttrProgress.get(this.spearkingSSU)!)
      speak(this.spearkingSSU)
    }
    this.dispatchEvent(new CustomEvent(ReadSpeak.CHANGE_EVENT_NAME, { detail: { rate: newRate } }))
  }
}

const createAudioBufferRequest = (text: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestAudioBuffer = async function* (retryTimes: number = 0): any {
    if (retryTimes > 3) {
      throw new Error('request audio buffer failed, text: ' + text)
    }
    const communicate = new Communicate(text, { voice: 'zh-CN-XiaoxiaoNeural' })
    try {
      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio') {
          yield chunk.data!.buffer
        }
      }
    } catch (err) {
      logger.info(`request audio buffer error, text: ${text} retry times`, retryTimes, err)
      await new Promise(resolve => setTimeout(resolve, 200 * (retryTimes + 1)))
      yield* requestAudioBuffer(retryTimes + 1)
    }
  }
  return requestAudioBuffer
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
    return {
      el,
      scrollIntoView,
    }
  }
  requestSegment = () => {
    const info = this.#readyNext(this.generatedEl || undefined)
    if (!info) {
      this.stop();
      throw new Error('no next info')
    }
    const { el, scrollIntoView } = info;
    this.generatedEl = el
    const seg = new SegmentAudio(createAudioBufferRequest(el.innerText || ''))

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
