import { register, unregister } from './register-sw'
import { env, initDisableAnim, initEruda, initMoreContrast } from '@/utils/env'
import './assets/main.scss'
import 'material-symbols/outlined.css'
import 'normalize.css'

import VirtualList from 'vue-virtual-list-v3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Logger from 'js-logger'

import App from './App.vue'
import { appRouter } from './router'
import { supportTapEvent } from './utils/gesture'

supportTapEvent()

Logger.useDefaults({
  formatter: function (messages, context) {
    if (context.name) {
      messages.unshift(`[${context.name}]`)
    }
    const time = new Date(Date.now() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().replace('Z', '')
    messages.unshift(`[${time}]`)
  }
})

initEruda()
initDisableAnim()
initMoreContrast()

const app = createApp(App)

app.use(createPinia())
app.use(appRouter)
app.use(VirtualList)

app.mount('#app')

if (import.meta.env.DEV && !env.isApp()) {
  document.documentElement.classList.add('mock-safe-area')
}

if (import.meta.env.PROD) {
  register()
} else {
  unregister()
}
