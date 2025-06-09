import { createMemoryHistory, createRouter, type RouteLocation, type Router, type RouterHistory } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import AdvancedPrfsView from '@/views/AdvancedPrfsView.vue'
import HomeView from '@/views/HomeView.vue'

const createAppHistory = (base?: string): RouterHistory => {
  const mh = createMemoryHistory(base)

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
    ...mh,
    push(to, data) {
      const result = mh.push(to, data)
      replaceHash(mh.location)
      return result
    },
    replace(to, data) {
      const result = mh.replace(to, data)
      replaceHash(mh.location)
      return result
    },
    go(delta, triggerListeners) {
      const result = mh.go(delta, triggerListeners)
      replaceHash(mh.location)
      return result
    },
  }
}

const router = createRouter({
  history: createAppHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/read/:id',
      name: 'read',
      props: true,
      component: ReadView
    },
    {
      path: '/book',
      name: 'book',
      children: [
        {
          path: 'time/:id',
          name: 'readTime',
          props: true,
          component: () => import('@/views/ReadTimeView.vue')
        },
        {
          path: 'notes/:id',
          name: 'notes',
          props: true,
          component: () => import('@/views/NotesView.vue')
        },
      ]
    },
    {
      path: '/state/read-time',
      name: 'readTimeState',
      props: true,
      component: () => import('@/views/StateView.vue')
    },
    {
      path: '/state/notes',
      name: 'notesState',
      props: true,
      component: () => import('@/views/NotesStateView.vue')
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

type IRouterHandler = (to: RouteLocation, from: RouteLocation) => void
type IRouterPopHandler = (delta: number, to: RouteLocation, from: RouteLocation) => void

const createAppRouter = (router: Router): Router & {
    onPop: (callback: IRouterPopHandler) => void,
    onPush: (callback: IRouterHandler) => void,
    onReplace: (callback: IRouterHandler) => void,
    offPop: (callback: IRouterPopHandler) => void,
    offPush: (callback: IRouterHandler) => void,
    offReplace: (callback: IRouterHandler) => void,
} => {
  const popCallbacks: IRouterPopHandler[] = []
  const pushCallbacks: IRouterHandler[] = []
  const replaceCallbacks: IRouterHandler[] = []
  return {
    ...router,
    async push (...args: Parameters<typeof router.push>) {
      const current = router.currentRoute.value
      const result = await router.push(...args)
      pushCallbacks.forEach(callback => callback(router.currentRoute.value, current))
      return result
    },
    back() {
      const current = router.currentRoute.value
      const result = router.back()
      popCallbacks.forEach(callback => callback(-1, router.currentRoute.value, current))
      return result
    },
    forward() {
      const current = router.currentRoute.value
      const result = router.forward()
      pushCallbacks.forEach(callback => callback(router.currentRoute.value, current))
      return result
    },
    go (delta: number) {
      if (delta > 1) {
        throw new Error('暂不支持前进多个路由')
      }
      const current = router.currentRoute.value
      const result = router.go(delta)
      if (delta < 0) {
        popCallbacks.forEach(callback => callback(delta, router.currentRoute.value, current))
      } else {
        pushCallbacks.forEach(callback => callback(router.currentRoute.value, current))
      }
      return result
    },
    async replace(...args: Parameters<typeof router.replace>) {
      const current = router.currentRoute.value
      const result = await router.replace(...args)
      replaceCallbacks.forEach(callback => callback(router.currentRoute.value, current))
      return result
    },
    onPop(callback: IRouterPopHandler) {
      popCallbacks.push(callback)
    },
    onPush(callback: IRouterHandler) {
      pushCallbacks.push(callback)
    },
    onReplace(callback: IRouterHandler) {
      replaceCallbacks.push(callback)
    },
    offPop(callback) {
      popCallbacks.splice(popCallbacks.indexOf(callback), 1)
    },
    offPush(callback) {
      pushCallbacks.splice(pushCallbacks.indexOf(callback), 1)
    },
    offReplace(callback) {
      replaceCallbacks.splice(replaceCallbacks.indexOf(callback), 1)
    },
  }
}

export const appRouter = createAppRouter(router)
