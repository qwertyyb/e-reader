import { createMemoryHistory, createRouter, type RouterHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import BookListView from '@/views/BookListView.vue'
import ReadView from '@/views/ReadView.vue'
import ImportView from '@/views/ImportView.vue'
import AIChatView from '@/views/AIChatView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import { ref, type Ref } from 'vue'
import AboutView from '@/views/AboutView.vue'
import DebugView from '@/views/DebugView.vue'

export const transitionName = ref('')

const createAppHistory = (options: {
  base?: string,
  transitionName: Ref<string>
  defaultPushTransitionName: string
  defaultPopTransitionName: string
  ignoreLocations: RegExp[]
}): RouterHistory => {
  const mh = createMemoryHistory(options.base)

  const replaceHash = (location: string) => {
    const [prefix] = window.location.href.split('#')
    return window.history.replaceState(null, '', [prefix, location || '/'].join('#'))
  }

  return {
    base: mh.base,
    location: mh.location,
    state: mh.state,
    destroy() {
      mh.destroy()
    },
    push(to, data) {
      if (options.ignoreLocations.some(reg => reg.test(to))) {
        // 跳转去阅读界面的动画是自定义的，所以无须使用这里的过渡
        options.transitionName.value = ''
      } else {
        options.transitionName.value = options.defaultPushTransitionName
      }
      const result = mh.push(to, data)
      replaceHash(mh.location)
      return result
    },
    replace(to, data) {
      options.transitionName.value = ''
      return mh.replace(to, data)
    },
    go(delta, triggerListeners) {
      if (options.ignoreLocations.some(reg => reg.test(mh.location))) {
        // 从阅读界面退出的动画是自定义的，无须使用这里的过渡
        options.transitionName.value = ''
      } else {
        options.transitionName.value = delta > 0 ? options.defaultPushTransitionName : options.defaultPopTransitionName
      }
      const result = mh.go(delta, triggerListeners)
      replaceHash(mh.location)
      return result
    },
    createHref(location) {
      return mh.createHref(location)
    },
    listen(cb) {
      return mh.listen(cb)
    },
  }
}

const router = createRouter({
  history: createAppHistory({
    base: import.meta.env.BASE_URL,
    transitionName: transitionName,
    defaultPushTransitionName: 'slide-left',
    defaultPopTransitionName: 'slide-right',
    ignoreLocations: [/^\/read\/\d+/]
  }),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/tab/local',
    },
    {
      path: '/tab',
      name: 'tab',
      component: TabView,
      children: [
        {
          path: 'local',
          name: 'local',
          component: BookListView
        },
        {
          path: 'remote',
          name: 'remote',
          component: BookListView
        }
      ]
    },
    {
      path: '/read/:id',
      name: 'read',
      props: true,
      component: ReadView
    },
    {
      path: '/book/:id/notes',
      name: 'notes',
      props: true,
      component: () => import('@/views/NotesView.vue')
    },
    {
      path: '/import',
      name: 'import',
      props: true,
      component: ImportView
    },
    {
      path: '/ai',
      name: 'ai',
      children: [
        {
          path: 'chat',
          name: 'ai-chat',
          props: true,
          component: AIChatView
        }
      ]
    },
    {
      path: '/preferences',
      name: 'preferences',
      component: PreferencesView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/debug',
      name: 'debug',
      component: DebugView
    }
  ],
})

export default router
