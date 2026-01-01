import { register, unregister } from './register-sw'
import { initDisableAnim, initEruda, initMoreContrast } from '@/utils/env'
import './assets/main.scss'
import 'material-symbols/outlined.css'

import VirtualList from 'vue-virtual-list-v3'
import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia'
import { ElLoadingDirective } from 'element-plus'
import Logger from 'js-logger'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-loading.css'

import App from './App.vue'
import router from './router'
import { supportTapEvent } from './utils/gesture'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

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

app.use(IonicVue)

app.use(createPinia())
app.use(router)
app.use(VirtualList)
app.directive('loading', ElLoadingDirective)

router.isReady().then(() => {
  app.mount('#app');
});

if (import.meta.env.PROD) {
  register()
} else {
  unregister()
  document.documentElement.classList.add('mock-safe-area')
}
