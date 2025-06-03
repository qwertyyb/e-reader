import { createMemoryHistory, createRouter, type RouteLocation, type RouterHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import ShelfView from '@/views/ShelfView.vue'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import { ref, type Ref } from 'vue'
import AboutView from '@/views/AboutView.vue'
import AdvancedPrfsView from '@/views/AdvancedPrfsView.vue'
import MyView from '@/views/MyView.vue'

export const transitionName = ref('')

const createAppHistory = (options: {
  base?: string,
  transitionName: Ref<string>
  defaultPushTransitionName: string
  defaultPopTransitionName: string
  ignoreLocations: RegExp[]
}): RouterHistory => {
  const mh = createMemoryHistory(options.base)

  const defaultPath = location.hash.replace('#', '') || '/'
  if (defaultPath !== '/') {
    // 如果当前路径不在主页，则先把主页 push 进历史中，确保后退可以后退到主页
    mh.push('/')
  }
  mh.push(defaultPath)

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
      redirect: '/shelf',
      component: TabView,
      children: [
        {
          path: 'shelf',
          name: 'shelf',
          component: ShelfView
        },
        {
          path: 'my',
          name: 'my',
          component: MyView
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
      path: '/state',
      name: 'state',
      props: true,
      component: () => import('@/views/StateView.vue')
    },
    {
      path: '/import',
      name: 'import',
      props: true,
      component: () => import('@/views/ImportView.vue')
    },
    {
      path: '/ai',
      name: 'ai',
      children: [
        {
          path: 'chat',
          name: 'ai-chat',
          props: true,
          component: () => import('@/views/AIChatView.vue')
        }
      ]
    },
    {
      path: '/preferences',
      name: 'preferences',
      redirect: '/preferences/general',
      children: [
        {
          path: 'general',
          component: PreferencesView
        },
        {
          path: 'debug',
          name: 'debug',
          component: () => import('@/views/DebugView.vue')
        },
        {
          path: 'advanced',
          name: 'advancedPrfs',
          component: AdvancedPrfsView
        },
        {
          path: 'storage',
          name: 'storage',
          component: () => import('@/views/StorageView.vue')
        }
      ]
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/opds',
      name: 'opds',
      component: () => import('@/views/OPDSView.vue'),
      meta: {
        getKey(route: RouteLocation) {
          return `${String(route.name)}-${route.query.url}`
        }
      }
    }
  ],
})

window.addEventListener('hashchange', event => {
  const hash = event.newURL.split('#')[1] || '/'
  router.replace(hash || '/')
})

export default router
