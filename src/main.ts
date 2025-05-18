import { register, unregister } from './register-sw'
import MateChat from '@matechat/core';
import './assets/main.css'
import 'material-symbols/outlined.css'

import '@devui-design/icons/icomoon/devui-icon.css';

import VirtualList from 'vue-virtual-list-v3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoadingDirective } from 'element-plus'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-loading.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VirtualList)
app.directive('loading', ElLoadingDirective)
app.use(MateChat)

app.mount('#app')

if (import.meta.env.PROD) {
  register()
} else {
  unregister()
  document.documentElement.classList.add('mock-safe-area')
}
