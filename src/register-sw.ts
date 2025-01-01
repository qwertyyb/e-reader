import { showToast } from "./utils"
import sw from '../sw.ts?worker&url'
import { createBridge } from "./utils/bridge"

export const register = () => {
  if (!('serviceWorker' in navigator)) { return }
  navigator.serviceWorker.register(sw, { type: 'module' })
    .then(reg => {
      console.log('service worker register successfully: ', reg)
    })
    .catch(err => {
      console.error('service worker register failed: ', err)
    })
  navigator.serviceWorker.addEventListener('controllerchange', (e) => {
    console.log('controllerchange', e)
    showToast('已更新, 刷新页面后可应用')
  })

  if (location.search.includes('cache=1')) {
    navigator.serviceWorker.ready.then(async reg => {
      if (!reg.active) return;
      const res = await bridge.invoke('deleteAllCache')
      console.log('deleteAllCache', res)
    })
  }
}

export const unregister = () => {
  navigator.serviceWorker?.getRegistrations()
    .then(registrations => {
      registrations.map(r => {
        r.unregister()
      })
    })
}

export const bridge = createBridge(
  (payload) => {
    console.log(payload)
    navigator.serviceWorker.ready.then(reg => reg.active?.postMessage(payload))
  },
  (callback) => {
    navigator.serviceWorker?.addEventListener('message', event => callback(event.data))
  },
  {
    toast: (msg: string, duration?: number) => showToast(msg, duration),
    prompt: window.prompt
  }
)
