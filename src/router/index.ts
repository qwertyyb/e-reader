import { createRouter, createWebHashHistory, type RouteLocation, type RouteLocationNormalizedLoadedGeneric, type Router } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import AdvancedPrfsView from '@/views/AdvancedPrfsView.vue'
import HomeView from '@/views/HomeView.vue'
import { ref, markRaw, type Ref } from 'vue'
import { historyKey, type RouteHistory } from './const'

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
    history: Ref<RouteHistory>
} => {
  const popCallbacks: IRouterPopHandler[] = []
  const pushCallbacks: IRouterHandler[] = []
  const replaceCallbacks: IRouterHandler[] = []

  const history = ref<RouteHistory>([])

  // @ts-ignore
  window.customHistory = history;

  router.isReady().then(() => {
    history.value.push(markRaw(router.currentRoute.value))
    window.addEventListener('popstate', (event) => {
      popCallbacks.forEach(callback => callback(-1, { hasUAVisualTransition: event.hasUAVisualTransition }))
    })
  });

  const pushHistory = (route: RouteLocationNormalizedLoadedGeneric) => {
    console.log('pushHistory', route)
    if (history.value.length <= 0) {
      history.value.push(markRaw(route))
      return
    }
    const last = history.value[history.value.length - 1]
    for (let i = 0; i < Math.min(last.matched.length, route.matched.length); i++) {
      const lastMatched = last.matched[i]
      if (lastMatched.components?.default && lastMatched.components?.default === route.matched[i].components?.default) {
        last.instance?.dispatchPageLeave();
        if (last.history) {
          last.history.push(markRaw(route))
        } else {
          last.history = [markRaw(route)]
        }
        return;
      }
    }
    history.value.push(markRaw(route))
  }

  const popHistoryInner = (delta: number, routeHistory: RouteHistory = history.value): [number, RouteHistory] => {
    if (delta === 0) return [delta, routeHistory]
    if (delta > 0) {
      throw new Error('暂不支持前进')
    }

    let deltaLeft = delta
    for (let i = routeHistory.length - 1; i >= 0; i--) {
      if (routeHistory[i].history?.length) {
        const result = popHistoryInner(delta, routeHistory[i].history)
        deltaLeft = result[0]
        routeHistory[i].history = result[1];
      }
    }
    return [deltaLeft, routeHistory]
  }

  const popHistory = (delta: number) => {
    const result = popHistoryInner(delta, history.value)
    history.value = result[1]
  }

  const appRouter: Router = {
    ...router,
    async push(...args: Parameters<typeof router.push>) {
      console.log('push')
      const lastRoute = router.currentRoute.value
      const result = await router.push(...args)
      const current = router.currentRoute.value;
      pushCallbacks.forEach(callback => callback(router.currentRoute.value, lastRoute))

      // 判断新的路由页面是否和上一个页面共用了同一个父组件，如果共用了，则把历史记录到父组件下面
      pushHistory(current)
      return result
    },
    back() {
      const result = router.back()
      history.value.pop();
      popHistory(-1);
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
      popHistory(delta)
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
  }

  return {
    ...appRouter,
    history,
    install(app) {
      app.use(appRouter);
      app.provide(historyKey, history)
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

