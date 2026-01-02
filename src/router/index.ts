import { createRouter, createWebHashHistory, type RouteLocation, type RouteLocationNormalizedLoadedGeneric, type Router } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import HomeView from '@/views/HomeView.vue'
import { ref, markRaw, type Ref, toRaw, shallowRef, type ShallowRef } from 'vue'
import { historyKey, type RouteHistory, type RouteHistoryItem } from './const'
import { findLatestHistoryNode, pop, push, replace, type RootRouteHistoryNode } from './history'
import ShelfView from '@/views/ShelfView.vue'
import MyView from '@/views/MyView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/shelf',
      children: [
        {
          path: 'shelf',
          name: 'home-tab-shelf',
          component: ShelfView,
        },
        {
          path: 'opds',
          name: 'home-tab-opds',
          component: () => import('@/views/OPDSView.vue'),
        },
        {
          path: 'my',
          name: 'home-tab-my',
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
      children: [
        {
          path: 'view/:name?',
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
    history: ShallowRef<RootRouteHistoryNode>
} => {
  const popCallbacks: IRouterPopHandler[] = []
  const pushCallbacks: IRouterHandler[] = []
  const replaceCallbacks: IRouterHandler[] = []

  const history = ref<RootRouteHistoryNode>({
    matchedRoute: null,
    children: []
  })

  router.isReady().then(() => {
    pushHistory(router.currentRoute.value)
    window.addEventListener('popstate', (event) => {
      popCallbacks.forEach(callback => callback(-1, { hasUAVisualTransition: event.hasUAVisualTransition }))
    })
  });

//   const pushHistory = async (route: RouteLocationNormalizedLoadedGeneric) => {
//     const item: RouteHistoryItem = { location: markRaw(route), history: [] }
//     const last = history.value[history.value.length - 1]
//     for (let i = 0; i < Math.min(last?.location.matched.length ?? 0, route.matched.length) - 1; i++) {
//       const lastMatched = last.location.matched[i]
//       if (lastMatched.components?.default && lastMatched.components?.default === route.matched[i].components?.default) {
//         if (!last.history) {
//           last.history = []
//         }
//         // 执行生命周期函数，在当前路由上执行 onForwardFrom、在目标路由上执行 onForwardTo
//         await Promise.all(last.lifecycle?.onForwardFrom?.map(fn => fn(last.location, route)) ?? [])

//         last.history.push(item)

//         Promise.resolve().then(async () => {
//           await Promise.all(item.lifecycle?.onForwardTo?.map(fn => fn(route, last.location)) ?? [])
//         })

//         return;
//       }
//     }
//     // 执行生命周期函数，在当前路由上执行 onForwardFrom、在目标路由上执行 onForwardTo
//     await Promise.all(last?.lifecycle?.onForwardFrom?.map(fn => fn(last.location, route)) ?? [])

//     history.value.push(item)

//     Promise.resolve().then(async () => {
//       await Promise.all(item.lifecycle?.onForwardTo?.map(fn => fn(route, last.location)) ?? [])
//     })

//     return;
//   }

//   const popHistoryInner = (delta: number, routeHistory: RouteHistory = history.value): [number, RouteHistory] => {
//     if (delta === 0) return [delta, routeHistory]
//     if (delta > 0) {
//       throw new Error('暂不支持前进')
//     }

//     let deltaLeft = delta
//     for (let i = routeHistory.length - 1; i >= 0; i--) {
//       if (routeHistory[i].history?.length) {
//         // 这是一个嵌套的历史记录，需要递归处理内部的 history, 返回剩余的 delta 和处理后的 history
//         const result = popHistoryInner(delta, [...routeHistory[i].history! ])
//         deltaLeft = result[0]
//         routeHistory[i].history = result[1];
//       }
//       if (deltaLeft < 0) {
//         routeHistory = [ ...routeHistory.slice(0, -1) ];
//         deltaLeft += 1;
//       }
//       if (deltaLeft === 0) {
//         break;
//       }
//     }
//     return [deltaLeft, routeHistory]
//   }

//   const findLastHistoryItem = (history: RouteHistory): RouteHistoryItem | undefined => {
//     const last = history[history.length - 1]
//     if (last?.history?.length) {
//       return findLastHistoryItem(last.history)
//     }
//     return last
//   }

//   /**
//  * 处理路由回退操作，执行相关生命周期函数
//  * @param {number} delta - 回退的步数（历史记录中的偏移量）
//  * @description 在当前路由上执行onBackFrom，在目标路由上执行onBackTo
//  */
//   const popHistory = async (delta: number) => {
//     const current = findLastHistoryItem(history.value)!

//     const expect = popHistoryInner(delta, [ ...toRaw(history.value) ])
//     const target = findLastHistoryItem(expect[1])!

//     // 执行生命周期函数，在当前路由上执行 onBackFrom，在目标路由上执行 onBackTo
//     await Promise.all(current.lifecycle?.onBackFrom?.map(fn => fn(current.location, target.location)) ?? [])

//     history.value = expect[1]

//     await Promise.all(target.lifecycle?.onBackTo?.map(fn => fn(target.location, current.location)) ?? [])
//   }

//   const replaceHistory = async (route: RouteLocationNormalizedLoadedGeneric) => {
//     const current = findLastHistoryItem(history.value)!;
//     await Promise.all(current.lifecycle?.onReplaceFrom?.map(fn => fn(current.location, route)) ?? [])

//     const expect = popHistoryInner(-1, [ ...toRaw(history.value) ])
//     history.value = expect[1]
//     pushHistory(route)

//     await Promise.all(current.lifecycle?.onReplaceTo?.map(fn => fn(route, current.location)) ?? [])
//   }

  const pushHistory = (location: RouteLocation) => {
    history.value = push(location, toRaw(history.value))
  }

  const popHistory = (delta: number) => {
    if (delta > 0) {
      throw new Error('暂不支持前进')
    }
    history.value = pop(toRaw(history.value), -delta)
  }

  const replaceHistory = (route: RouteLocation) => {
    history.value = replace(route, history.value)
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
      replaceHistory(router.currentRoute.value)
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

