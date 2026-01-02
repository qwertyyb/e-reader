import { createRouter, createWebHashHistory, type RouteLocation, type Router } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import HomeView from '@/views/HomeView.vue'
import { ref, markRaw, type Ref } from 'vue'
import { historyKey, type RouteHistoryItem, type RouteHistoryLifecycle } from './const'
import ShelfView from '@/views/ShelfView.vue'
import MyView from '@/views/MyView.vue'
import { disableAnim, isSmall } from '@/utils/env'

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

const createAppRouter = (router: Router): Router & {
  [key in keyof RouteHistoryLifecycle]: (fn: RouteHistoryLifecycle[key]) => void
} & {
    history: Ref<RouteHistoryItem[]>
} => {

  const lifecycle: { 
    [key in keyof RouteHistoryLifecycle]: RouteHistoryLifecycle[key][]
  } = {
    onForwardTo: [],
    onBackTo: [],
    onBackFrom: [],
    onForwardFrom: [],
    onReplaceFrom: [],
    onReplaceTo: []
  }

  const history = ref<RouteHistoryItem[]>([])

  router.isReady().then(() => {
    pushHistory(router.currentRoute.value)
    router.options.history.listen((to, from, info) => {
      if (info.delta > 0) {
        pushHistory(router.resolve(to))
      } else {
        popHistory(info.delta)
      }
    })
  });

  const pushHistory = async (location: RouteLocation) => {
    const newItem: RouteHistoryItem = markRaw({
      location,
      uniqueId: crypto.randomUUID()
    })

    // 执行生命周期函数，先执行组件上的 onForwardFrom 再执行全局的 onForwardFrom
    const last = history.value[history.value.length - 1];
    if (last) {
      await Promise.all(last.lifecycle?.onForwardFrom?.map(fn => fn(last, newItem)) ?? [])
    }

    await Promise.all(lifecycle.onForwardFrom.map(fn => fn(last, newItem)))

    history.value.push(newItem)

    Promise.resolve().then(async () => {
      // 先执行全局的 onForwadTo 再执行 组件内的 onFowardTo
      await Promise.all(lifecycle.onForwardTo.map(fn => fn(newItem, last)))
      await Promise.all(newItem.lifecycle?.onForwardTo?.map(fn => fn(newItem, last)) ?? [])
    })
  }

  const popHistory = async (delta: number) => {
    if (delta > 0) {
      throw new Error('暂不支持前进')
    }
    const target = history.value[history.value.length + delta - 1]
    const current = history.value[history.value.length - 1]

    // 执行生命周期函数，在当前路由上执行 onBackFrom，在目标路由上执行 onBackTo
    // 先执行组件内的 onBackFrom 生命周期函数，再执行全局的 onBackFrom 生命周期函数
    await Promise.all(current.lifecycle?.onBackFrom?.map(fn => fn(current, target)) ?? [])

    await Promise.all(lifecycle.onBackFrom.map(fn => fn(current, target)))

    history.value = history.value.slice(0, history.value.length + delta)

    // 先执行全局的 onBackTo 生命周期函数，再执行组件内的 onBackTo 生命周期函数
    await Promise.all(lifecycle.onBackTo.map(fn => fn(target, current)))

    if (target) {
      await Promise.all(target.lifecycle?.onBackTo?.map(fn => fn(target, current)) ?? [])
    }
  }
  const replaceHistory = async (route: RouteLocation) => {
    // replace 的实现会有些反直觉，实现上需要先 push 新路由再移除原路由

    const newItem: RouteHistoryItem = markRaw({
      location: route,
      uniqueId: crypto.randomUUID()
    })

    const current = history.value[history.value.length - 1]

    await Promise.all(current.lifecycle?.onReplaceFrom?.map(fn => fn(current, newItem)) ?? [])

    await Promise.all(lifecycle.onReplaceFrom.map(fn => fn(current, newItem)))

    history.value = [...history.value, newItem]
    
    Promise.resolve().then(async () => {
      await Promise.all(lifecycle.onReplaceTo.map(fn => fn(newItem, current)))
      await Promise.all(newItem.lifecycle?.onReplaceTo?.map(fn => fn(newItem, current)) ?? [])
      history.value = history.value.filter(i => i !== current)
    })
  }

  const appRouter: Router = {
    ...router,
    async push(...args: Parameters<typeof router.push>) {
      const result = await router.push(...args)
      const current = router.currentRoute.value;

      // 判断新的路由页面是否和上一个页面共用了同一个父组件，如果共用了，则把历史记录到父组件下面
      pushHistory(current)
      return result
    },
    back() {
      const result = router.back()
      // popHistory(-1);
      return result
    },
    forward() {
      const result = router.forward()
      return result
    },
    go (delta: number) {
      if (delta > 1) {
        throw new Error('暂不支持前进多个路由')
      }
      const result = router.go(delta)
      popHistory(delta)
      return result
    },
    async replace(...args: Parameters<typeof router.replace>) {
      const result = await router.replace(...args)
      replaceHistory(router.currentRoute.value)
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
    onBackFrom(fn) {
      lifecycle.onBackFrom.push(fn)
    },
    onBackTo(fn) {
      lifecycle.onBackTo.push(fn)
    },
    onForwardFrom(fn) {
      lifecycle.onForwardFrom.push(fn)
    },
    onForwardTo(fn) {
      lifecycle.onForwardTo.push(fn)
    },
    onReplaceFrom(fn) {
      lifecycle.onReplaceFrom.push(fn)
    },
    onReplaceTo(fn) {
      lifecycle.onReplaceTo.push(fn)
    }
  }
}

export const appRouter = createAppRouter(router)

appRouter.onForwardTo((to, from) => {
  if (disableAnim.value || !from || to.location.name === 'read') return;
  const list = Array.from(document.querySelectorAll('.c-history-page.current'))
  const cur = list.at(-1)
  const prev = cur?.previousElementSibling
  if (!cur || !prev) return;

  prev.animate([{ transform: `translateX(0)` }, { transform: `translateX(-30%)` }], { duration: 200, easing: 'ease-out' })
  cur.animate([{ transform: `translateX(100%)` }, { transform: `translateX(0)` }], { duration: 200, easing: 'ease-out' })
})

appRouter.onBackFrom((curRoute) => {
  if (disableAnim.value || curRoute.location.name === 'read') return;
  const list = Array.from(document.querySelectorAll('.c-history-page.current'))
  const cur = list.at(-1)
  const prev = cur?.previousElementSibling
  if (!cur || !prev) return;

  const anim1 = prev.animate(
    [
      { transform: `translateX(0)`, '--mask-opacity': '0' },
      {
        transform: `translateX(-30%)`,
        '--mask-opacity': '0'
      }
    ],
    { duration: 200, easing: 'ease-in', direction: 'reverse' }
  )
  const anim2 = cur.animate(
    [
      { transform: `translateX(100%)` },
      { transform: `translateX(0)` }
    ],
    { duration: 200, easing: 'ease-in', direction: 'reverse' }
  )
  return Promise.all([anim1.finished, anim2.finished])
})

appRouter.onReplaceTo((newRoute, oldRoute) => {
  if (disableAnim.value || !isSmall.value) return;
  const tabs = ['home-tab-shelf', 'home-tab-opds', 'home-tab-my']
  const oldIndex = tabs.indexOf(oldRoute.location.name as string)
  const newIndex = tabs.indexOf(newRoute.location.name as string)
  if (oldIndex === -1 || newIndex === -1) {
    return
  }
  const oldEl = Array.from(document.querySelectorAll(`[data-route-unique-id=${JSON.stringify(oldRoute.uniqueId)}]`)).at(-1)
  const newEl = Array.from(document.querySelectorAll(`[data-route-unique-id=${JSON.stringify(newRoute.uniqueId)}]`)).at(-1)
  if (!oldEl || !newEl) return;
  const direction = newIndex > oldIndex ? 'normal' : 'reverse';
  const oldAnim = (newIndex > oldIndex ? oldEl : newEl).animate(
    [
      { transform: 'translateX(0)'},
      { transform: 'translateX(-100%)'}
    ],
    { duration: 200, easing: 'ease-out', direction }
  )
  const newAnim = (newIndex > oldIndex ? newEl : oldEl).animate(
    [
      { transform: 'translateX(100%)' },
      { transform: 'translateX(0)' }
    ],
    { duration: 200, easing: 'ease-out', direction }
  )
  return Promise.all([oldAnim.finished, newAnim.finished])
})
