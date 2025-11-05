// async function createStreamAudio(options){
//   // Specific video format and codec
//   const mediaType = 'audio/mpeg';
//   const MediaSource = window.MediaSource || window.ManagedMediaSource

import { TypedEventTarget } from "./TypedEventTarget"


//   // Check if the type of video format / codect is supported.
//   if (!MediaSource.isTypeSupported(mediaType)) {
//     return; // Not supported, do something else.
//   }

//   // Set up video and its  source.
//   const audio = document.createElement("audio");
//   const source = new MediaSource();

//   audio.disableRemotePlayback = true;
//   audio.controls = true;
//   audio.loop = false;

//   await new Promise((resolve) => {
//     audio.src = URL.createObjectURL(source);
//     source.addEventListener("sourceopen", resolve, { once: true });
//     document.body.appendChild(audio);
//   });

//   console.log(source.readyState)

//   const sourceBuffer = source.addSourceBuffer(mediaType);

//   const maxBufferSize = 20
//   const cleanupThreshold = 20
//   const cleanupBuffer = async () => {
//     if (!sourceBuffer.buffered.length || sourceBuffer.updating) {
//       return;
//     }

//     const currentTime = audio.currentTime;
//     const buffered = sourceBuffer.buffered;

//     // 计算总缓冲时长
//     let totalBufferDuration = 0;
//     for (let i = 0; i < buffered.length; i++) {
//       totalBufferDuration += buffered.end(i) - buffered.start(i);
//     }

//     // 如果缓冲区过大，清理已播放的部分
//     if (totalBufferDuration > maxBufferSize) {
//       const removeEndTime = currentTime - cleanupThreshold;

//       if (removeEndTime > 0) {
//         try {
//           sourceBuffer.remove(0, removeEndTime);
//           await new Promise(resolve => sourceBuffer.addEventListener('updateend', resolve, { once: true }))
//         } catch (error) {
//           console.warn('Buffer cleanup failed:', error);
//         }
//       }
//     }
//   }


//   audio.appendBuffer = async (arrayBuffer) => {
//     sourceBuffer.appendBuffer(arrayBuffer)
//     await new Promise(resolve => sourceBuffer.addEventListener('updateend', resolve, { once: true }))
//     await cleanupBuffer()
//   }

//   const requestBuffer = async () => {
//     audio.buffering = true
//     for await (const buffer of options.request()) {
//       await audio.appendBuffer(buffer)
//     }
//     audio.buffering = false
//   }

//   audio.addEventListener('timeupdate', async () => {
//     if (audio.buffering) return;
//     // 计算还可以播放多久
//     console.log('duration', audio.duration, audio.buffered.length)
//     console.log('currentTime', audio.currentTime)
//     if (!audio.buffered.length) return;

//     console.log('end', audio.buffered.end(audio.buffered.length - 1))

//     const left = audio.buffered.end(audio.buffered.length - 1) - audio.currentTime
//     if (left < maxBufferSize) {
//       // 需要缓冲新的内容
//       await requestBuffer()
//     }
//   })

//   audio.addEventListener('waiting', requestBuffer)

//   audio.start = async () => {
//     console.log('readyState', audio.readyState)
//     if (audio.readyState == 3 || audio.readyState === 4) {
//       return audio.play()
//     }
//     // 没有可播放的内容，加载
//     await requestBuffer()
//     return audio.play()
//   }

//   return audio
// }

declare global {
  interface Window {
    // iOS safari
    ManagedMediaSource?: MediaSource
  }
}

export class SegmentAudio extends TypedEventTarget<{
  start: Event,
  end: Event,
}> {
  readonly requestData: () => AsyncIterable<ArrayBufferLike>;
  constructor(requestData: () => AsyncIterable<ArrayBufferLike>) {
    super();
    this.requestData = requestData
  }
}

interface IOptions {
  request: () => SegmentAudio | undefined | null,
  bufferSize: number,
}

const defaultOptions: Omit<IOptions, 'request'> = {
  bufferSize: 20, // 缓冲 20 秒
}

export class StreamAudioPlayer {
  #source: MediaSource = new (window.MediaSource || window.ManagedMediaSource)()
  #audio = new Audio()
  #ready: Promise<void>
  #sourceBuffer: SourceBuffer | null = null
  #buffering = false
  #segments: { segment: SegmentAudio, start: number, end?: number }[] = []
  #emits = new WeakMap<
    { segment: SegmentAudio, start: number, end?: number },
    { start: boolean, end: boolean }
  >()
  options: IOptions
  constructor(options: { request: () => SegmentAudio }) {
    this.options = { ...defaultOptions, ...options }
    this.#audio.disableRemotePlayback = true;
    this.#audio.controls = true;
    this.#audio.loop = false;
    this.#ready = new Promise((resolve) => {
      this.#audio.src = URL.createObjectURL(this.#source);
      this.#source.addEventListener("sourceopen", () => resolve(), { once: true });
    })
    this.#ready.then(() => {
      this.#sourceBuffer = this.#source.addSourceBuffer('audio/mpeg')
    })
    this.#audio.addEventListener('waiting', this.#requestBuffer)
    this.#audio.addEventListener('waitingforkey', this.#requestBuffer)
    this.#audio.addEventListener('timeupdate', this.#timeupdateHandler)
  }
  #timeupdateHandler = async () => {
    // 查看一下当前播放到哪个片段了
    const currentTime = this.#audio.currentTime
    const playingIndex = this.#segments.findLastIndex(seg => seg.start < currentTime)
    if (playingIndex >= 0) {
      // 之前的片段要 emit start 和 end 事件
      this.#segments.slice(0, playingIndex).forEach((seg) => {
        const { start, end } = this.#emits.get(seg) || {}
        if (!start) {
          seg.segment.dispatchEvent(new Event('start'))
          this.#emits.set(seg, { start: true, end: end || false })
        }
        if (!end) {
          seg.segment.dispatchEvent(new Event('end'))
          this.#emits.set(seg, { start: true, end: true })
        }
      })
      // 当前片段要 emit start 事件
      const playing = this.#segments[playingIndex]
      const { start } = this.#emits.get(playing) || {}
      if (!start) {
        playing.segment.dispatchEvent(new Event('start'))
        this.#emits.set(playing, { start: true, end: false })
      }
      // 已播完的就清除掉
      this.#segments = this.#segments.slice(playingIndex)
    }

    if (this.#buffering) return;
    const maxBufferSize = 20;
    // 计算还可以播放多久
    if (!this.#audio.buffered.length) return;

    const left = this.#audio.buffered.end(this.#audio.buffered.length - 1) - this.#audio.currentTime
    if (left < maxBufferSize) {
      // 需要缓冲新的内容
      await this.#requestBuffer()
    }
  }
  async play() {
    if (this.#audio.readyState == 3 || this.#audio.readyState === 4) {
      return this.#audio.play()
    }
    // 没有可播放的内容，加载
    await this.#requestBuffer()
    return this.#audio.play()
  }
  pause() {
    this.#audio.pause();
  }

  public get paused() : boolean {
    return this.#audio.paused
  }

  public get playbackRate(): number {
    return this.#audio.playbackRate
  }
  public set playbackRate(value: number) {
    this.#audio.playbackRate = value
  }

  addEventListener = this.#audio.addEventListener.bind(this.#audio)
  removeEventListener = this.#audio.removeEventListener.bind(this.#audio)

  // 获取当前缓冲的能播放多久
  #getLeftDuration = () => {
    const len = this.#audio.buffered.length
    if (len <= 0) return 0;
    return this.#audio.buffered.end(len - 1) - this.#audio.currentTime
  }

  #isNeedRequestBuffer = () => {
    return this.#getLeftDuration() < this.options.bufferSize
  }

  #requestBuffer = async (): Promise<void> => {
    if (this.#buffering) return;
    this.#buffering = true
    const len = this.#sourceBuffer?.buffered.length ?? 0
    const start = len <= 0 ? 0 : this.#sourceBuffer?.buffered.end(len - 1);
    const segment = this.options.request();
    if (!segment) {
      // 没有下个段落，已播完
      this.#buffering = false;
      return;
    }
    this.#segments.push({ segment, start: start ?? 0 })
    for await (const data of segment.requestData()) {
      await this.#appendBuffer(data as ArrayBuffer)
    }
    const afterLen = this.#sourceBuffer?.buffered.length ?? 0
    const end = afterLen <= 0 ? 0 : this.#sourceBuffer?.buffered.end(afterLen - 1);
    this.#segments[this.#segments.length - 1].end = end;
    this.#buffering = false

    // 判断一下当前是否达到了缓冲目标？如果未达到，则继续加载
    if (this.#isNeedRequestBuffer()) {
      return this.#requestBuffer()
    }
  }

  async #appendBuffer(arrayBuffer: ArrayBuffer) {
    if (!this.#sourceBuffer) return;
    this.#sourceBuffer.appendBuffer(arrayBuffer)
    await new Promise(resolve => this.#sourceBuffer!.addEventListener('updateend', resolve, { once: true }))
    await this.#cleanupBuffer()
  }

  #cleanupBuffer = async () => {
    if (!this.#sourceBuffer || !this.#sourceBuffer.buffered.length || this.#sourceBuffer.updating) {
      return;
    }
    const maxBufferSize = 20
    const cleanupThreshold = 20

    const currentTime = this.#audio.currentTime;
    const buffered = this.#sourceBuffer.buffered;

    // 计算总缓冲时长
    let totalBufferDuration = 0;
    for (let i = 0; i < buffered.length; i++) {
      totalBufferDuration += buffered.end(i) - buffered.start(i);
    }

    // 如果缓冲区过大，清理已播放的部分
    if (totalBufferDuration > maxBufferSize) {
      const removeEndTime = currentTime - cleanupThreshold;

      if (removeEndTime > 0) {
        try {
          this.#sourceBuffer.remove(0, removeEndTime);
          await new Promise(resolve => this.#sourceBuffer!.addEventListener('updateend', resolve, { once: true }))
        } catch (error) {
          console.warn('Buffer cleanup failed:', error);
        }
      }
    }
  }
}
