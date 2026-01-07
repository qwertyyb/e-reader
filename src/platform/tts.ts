import { TypedEventTarget } from '@/lib/TypedEventTarget'
import { QueueStrategy, TextToSpeech, type SpeechSynthesisVoice } from '@capacitor-community/text-to-speech'
import type { PluginListenerHandle } from '@capacitor/core'

class NativeSpeechSynthesisEvent extends Event {
  charIndex: number
  utterance: NativeSpeechSynthesisUtterance
  constructor(type: string, eventInitDict: EventInit & { charIndex: number, utterance: NativeSpeechSynthesisUtterance }) {
    super(type, eventInitDict)
    this.charIndex = eventInitDict?.charIndex || 0
    this.utterance = eventInitDict?.utterance
  }
}

export class NativeSpeechSynthesisUtterance extends TypedEventTarget<{
  boundary: NativeSpeechSynthesisEvent,
  end: NativeSpeechSynthesisEvent,
  start: NativeSpeechSynthesisEvent,
}> {
  text: string
  lang: string = 'zh-CN'
  pitch: number = 1
  rate = 1
  volume = 0.8
  voice: SpeechSynthesisVoice | null = null
  constructor(text: string) {
    super()
    this.text = text
  }
}

const uttrs: NativeSpeechSynthesisUtterance[] = []

let progressListener: PluginListenerHandle | null = null
let speaking = false

const startSpeak = async () => {
  while (uttrs.length) {
    const uttr = uttrs[0]
    uttr.dispatchEvent(new NativeSpeechSynthesisEvent('start', { charIndex: 0, utterance: uttr }))
    await TextToSpeech.speak({
      text: uttr.text,
      lang: uttr.lang,
      pitch: uttr.pitch,
      rate: uttr.rate,
      volume: uttr.volume,
      queueStrategy: QueueStrategy.Add
    })
    const endEvent = new NativeSpeechSynthesisEvent('end', { charIndex: uttr.text.length - 1, utterance: uttr })
    uttr.dispatchEvent(endEvent)
    uttrs.shift()
  }
}

export const speak = async (uttr: NativeSpeechSynthesisUtterance) => {
  uttrs.push(uttr)
  if (!speaking) {
    progressListener?.remove()
    progressListener = await TextToSpeech.addListener('onRangeStart', (info) => {
      const curUttr = uttrs[0]
      const boundaryEvent = new NativeSpeechSynthesisEvent('boundary', { charIndex: info.start, utterance: curUttr })
      curUttr.dispatchEvent(boundaryEvent)
    })
    speaking = true
    startSpeak()
  }
}

export const stop = async () => {
  speaking = false
  await TextToSpeech.stop()
  await progressListener?.remove()
}

export const isSpeaking = () => speaking