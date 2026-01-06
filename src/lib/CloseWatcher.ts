import { App } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'

// CloseWatcher API 的类型定义
export interface CloseWatcherOptions {
  signal?: AbortSignal
}

export type CloseWatcherCallback = (event: Event) => void

/**
 * 检测当前环境是否支持 CloseWatcher API
 */
export function isCloseWatcherSupported(): boolean {
  return 'CloseWatcher' in window && typeof window.CloseWatcher === 'function'
}

/**
 * CloseWatcher Polyfill 类
 * 在 web 端监听 escape 键，在 Android 端使用 Capacitor 监听后退按钮
 */
class CloseWatcherPolyfill extends EventTarget {
  #isDestroyed = false
  #paused = false
  #signal: AbortSignal | null = null
  #backButtonListener: PluginListenerHandle | null = null
  #onclose: CloseWatcherCallback | null = null
  #oncancel: CloseWatcherCallback | null = null

  #abortHandler = () => {
    this.destroy()
  }

  constructor(options: CloseWatcherOptions = {}) {
    super()
    this.#signal = options.signal || null

    // 如果提供了 signal，监听 abort 事件
    if (this.#signal) {
      if (this.#signal.aborted) {
        this.destroy()
        return
      }
      this.#signal.addEventListener('abort', this.#abortHandler)
    }

    // 根据平台初始化相应的监听器
    this.#initialize()
  }

  #initialize(): void {
    if (Capacitor.getPlatform() === 'android') {
      this.#initializeAndroidBackButton()
    } else {
      this.#initializeWebEscapeKey()
    }
  }

  #keydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !this.#paused) {
      this.requestClose()
    }
  }

  /**
   * 在 web 端初始化 escape 键监听
   */
  #initializeWebEscapeKey(): void {
    document.addEventListener('keydown', this.#keydownHandler)
  }

  /**
   * 在 Android 端初始化后退按钮监听
   */
  async #initializeAndroidBackButton() {
    this.#backButtonListener = await App.addListener('backButton', () => {
      if (this.#paused) return;
      this.requestClose()
    })
    if (this.#isDestroyed) {
      this.#backButtonListener.remove()
    }
  }

  /**
   * 设置关闭回调函数
   */
  set onclose(callback: CloseWatcherCallback | null) {
    if (this.#onclose) {
      this.removeEventListener('close', this.#onclose)
      this.#onclose = null
    }
    if (callback) {
      this.addEventListener('close', callback)
    }
    this.#onclose = callback;
  }
  get onclose() {
    return this.#onclose
  }

  set oncancel(callback: CloseWatcherCallback | null) {
    if (this.#oncancel) {
      this.removeEventListener('cancel', this.#oncancel)
      this.#oncancel = null
    }
    if (callback) {
      this.addEventListener('cancel', callback)
    }
    this.#oncancel = callback
  }
  get oncancel() {
    return this.#oncancel
  }

  /**
   * 销毁 CloseWatcher 实例
   */
  destroy(): void {
    if (this.#isDestroyed) return
    this.#isDestroyed = true

    // 清理 signal 监听器
    if (this.#signal) {
      this.#signal.removeEventListener('abort', this.#abortHandler)
    }

    // 清理 web 端监听器
    document.removeEventListener('keydown', this.#keydownHandler)

    this.#backButtonListener?.remove()
    this.#backButtonListener = null

    this.dispatchEvent(new Event('destroyed'))
  }

  close() {
    this.dispatchEvent(new Event('close'))
    this.destroy()
  }

  /**
   * 请求关闭（调用 onClose 回调）
   */
  requestClose(): void {
    if (this.#isDestroyed) return;
    if (this.dispatchEvent(new Event('cancel', { cancelable: true }))) {
      this.close()
    }
  }

  pause() {
    this.#paused = true
  }

  start() {
    this.#paused = false
  }
}

const createCloseWatcherPolyfillInstance = (() => {
  const instances: CloseWatcherPolyfill[] = []
  return (options: CloseWatcherOptions = {}) => {
    instances.forEach(item => item.pause())

    const instance = new CloseWatcherPolyfill(options)
    instance.addEventListener('destroyed', () => {
      instances.at(-1)?.start()
    }, { once: true })
    instances.push(instance)
    return instance
  }
})()

/**
 * 创建 CloseWatcher 实例
 * 如果浏览器原生支持 CloseWatcher API，则使用原生实现
 * 否则使用 polyfill 实现
 */
export function createCloseWatcher(options: CloseWatcherOptions = {}) {
  if (isCloseWatcherSupported()) {
    // 使用原生 CloseWatcher API
    return new CloseWatcher(options)
  }
  // 使用 polyfill
  return createCloseWatcherPolyfillInstance(options)
}

