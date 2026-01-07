/**
 * Android: 监听后退按钮，并执行相应的操作
 * Web: 监听 ESC 按钮，并执行相应的操作
 * 当有多个回调时，只执行最新的一个回调
 */
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

type BackButtonCallback = () => void

type ListenOptions = {
  once: boolean,
}

const callbacks: { fn: BackButtonCallback, options: ListenOptions }[] = []

export const onCloseRequest = (callback: BackButtonCallback, options?: ListenOptions) => {
  callbacks.push({ fn: callback, options: options || { once: false } })
  return () => {
    offClose(callback)
  }
}

export const offClose = (callback: BackButtonCallback) => {
  const index = callbacks.findIndex(item => item.fn === callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
}

const handler = () => {
  const callback = callbacks.at(-1)
  if (!callback) return
  callback.fn()
  if (callback.options.once) {
    offClose(callback.fn)
  }
}

const platform = Capacitor.getPlatform()

if (platform === 'android') {
  App.addListener('backButton', handler)
} else if (platform === 'web') {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      handler()
    }
  })
}