import { createRouter, createWebHashHistory } from '@ionic/vue-router';
import { type RouteLocation, type Router } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import HomeView from '@/views/HomeView.vue'
import { IonRouterOutlet } from '@ionic/vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
        {
          path: 'chat/:id?',
          name: 'ai-chat',
          props: true,
          component: () => import('@/views/AIChatView.vue')
        }
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
      path: '/preferences',
      redirect: '/preferences/view/basic',
      component: IonRouterOutlet,
      children: [
        {
          path: 'view/:panelName',
          name: 'preferences',
          component: PreferencesView,
          props: true,
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

export default router

// window.addEventListener('hashchange', event => {
//   const hash = event.newURL.split('#')[1] || '/'
//   router.replace(hash || '/')
// })

// export default router

type IRouterHandler = (to: RouteLocation, from: RouteLocation) => void
type IRouterPopHandler = (delta: number, options: { hasUAVisualTransition: boolean }) => void

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

  router.isReady().then(() => {
    window.addEventListener('popstate', (event) => {
      popCallbacks.forEach(callback => callback(-1, { hasUAVisualTransition: event.hasUAVisualTransition }))
    })
  });
  return {
    ...router,
    async push (...args: Parameters<typeof router.push>) {
      const current = router.currentRoute.value
      const result = await router.push(...args)
      pushCallbacks.forEach(callback => callback(router.currentRoute.value, current))
      return result
    },
    back() {
      const result = router.back()
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
        popCallbacks.forEach(callback => callback(delta, { hasUAVisualTransition: false }))
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

// export const appRouter = createAppRouter(router)

