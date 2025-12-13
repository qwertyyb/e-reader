import { register, unregister } from './register-sw'
import { initDisableAnim, initEruda, initMoreContrast } from '@/utils/env'
import './assets/main.scss'
import 'material-symbols/outlined.css'

import VirtualList from 'vue-virtual-list-v3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoadingDirective } from 'element-plus'
import Logger from 'js-logger'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-loading.css'

import App from './App.vue'
import { appRouter } from './router'

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
app.directive('loading', ElLoadingDirective)

app.mount('#app')

if (import.meta.env.PROD) {
  register()
} else {
  unregister()
  document.documentElement.classList.add('mock-safe-area')
}
