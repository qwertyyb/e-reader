import { showToast } from "./utils"
import sw from '../sw.ts?worker&url'
import { createBridge } from "./utils/bridge"

if ('serviceWorker' in navigator) {
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


// export const createBridge = <F extends (...args: any[]) => any>(calls: Record<string, F>) => {
//   if (!navigator.serviceWorker) {
//     return {
//       invoke() {}
//     }
//   }
//   const callbacks = new Map<string, (result: unknown) => void>()

//   navigator.serviceWorker.addEventListener('message', async event => {
//     const { type, method, args, returnValue, callback } = event.data
//     if (type === 'invoke') {
//       const result = await calls[method]?.(...args)
//       return event.source?.postMessage({
//         type: 'callback',
//         callback,
//         returnValue: result
//       })
//     }
//     if (type === 'callback') {
//       const cb = callbacks.get(callback);
//       if (cb) {
//         cb(returnValue);
//         callbacks.delete(callback);
//       }
//     }
//   })

//   return {
//     invoke (method: string, ...args: unknown[]) {
//       return new Promise(resolve => {
//         const callback = `callback_${Math.random()}`;
//         callbacks.set(callback, resolve);
//         navigator.serviceWorker.ready.then(reg => {
//           reg.active?.postMessage({
//             type: 'invoke',
//             callback,
//             method,
//             args
//           })
//         })
//       })
//     }
//   }
// }


export const bridge = createBridge(
  (payload) => navigator.serviceWorker.ready.then(reg => reg.active?.postMessage(payload)),
  (callback) => {
    navigator.serviceWorker.addEventListener('message', event => callback(event.data))
  },
  {
    toast: (msg: string, duration?: number) => showToast(msg, duration),
    prompt: window.prompt
  }
)
