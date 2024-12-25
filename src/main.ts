import './assets/main.css'

import VirtualList from 'vue-virtual-list-v3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VirtualList)

app.mount('#app')
