import { createRouter, createWebHashHistory, type RouteLocation, type Router } from 'vue-router'
import ReadView from '@/views/ReadView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import AboutView from '@/views/AboutView.vue'
import HomeView from '@/views/HomeView.vue'
import { ref, markRaw, type Ref } from 'vue'
import { historyKey, type RouteHistoryItem, type RouteHistoryLifecycle } from './const'
import ShelfView from '@/views/ShelfView.vue'
import MyView from '@/views/MyView.vue'
import { disableAnim, env, isSmall } from '@/utils/env'
import Logger from 'js-logger'
import { onCloseRequest } from '@/platform/close-listener'
import { App } from '@capacitor/app'
import { randomString, showToast } from '@/utils'

const logger = Logger.get('router')

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
      path: '/stats',
      children: [
        {
          path: 'duration',
          name: 'durationStats',
          props: true,
          component: () => import('@/views/ReadTimeStatsView.vue')
        },
        {
          path: 'reading',
          name: 'readingStats',
          props: true,
          component: () => import('@/views/ReadingStatsView.vue')
        },
        {
          path: 'notes',
          name: 'notesStats',
          props: true,
          component: () => import('@/views/NotesStatsView.vue')
        }
      ]
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
    router.options.history.listen(async (to, from, info) => {
      console.log('route listen callback', info)
      if (info.delta > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pushHistory(router.resolve(to), { hasUAVisualTransition: (info as any).hasUAVisualTransition })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await popHistory(info.delta, { hasUAVisualTransition: (info as any).hasUAVisualTransition })
        // 如果后退后历史记录已空(常见于页面重新加载场景)，则重新推入当前路由
        if (!history.value.length) {
          pushHistory(router.resolve(to))
        }
      }
    })
  });

  const pushHistory = async (location: RouteLocation, options?: { hasUAVisualTransition?: boolean }) => {
    const newItem: RouteHistoryItem = markRaw({
      location,
      uniqueId: randomString()
    })

    // 执行生命周期函数，先执行组件上的 onForwardFrom 再执行全局的 onForwardFrom
    const last = history.value[history.value.length - 1];
    if (last) {
      await Promise.all(last.lifecycle?.onForwardFrom?.map(fn => fn(last, newItem, options)) ?? [])
    }

    await Promise.all(lifecycle.onForwardFrom.map(fn => fn(last, newItem, options)))

    history.value.push(newItem)

    Promise.resolve().then(async () => {
      // 先执行全局的 onForwadTo 再执行 组件内的 onFowardTo
      await Promise.all(lifecycle.onForwardTo.map(fn => fn(newItem, last, options)))
      await Promise.all(newItem.lifecycle?.onForwardTo?.map(fn => fn(newItem, last, options)) ?? [])
    })
  }

  const popHistory = async (delta: number, options?: {  hasUAVisualTransition?: boolean }) => {
    if (delta > 0) {
      throw new Error('暂不支持前进')
    }
    const target = history.value[history.value.length + delta - 1]
    const current = history.value[history.value.length - 1]

    // 执行生命周期函数，在当前路由上执行 onBackFrom，在目标路由上执行 onBackTo
    // 先执行组件内的 onBackFrom 生命周期函数，再执行全局的 onBackFrom 生命周期函数
    await Promise.all(current.lifecycle?.onBackFrom?.map(fn => fn(current, target, options)) ?? [])

    await Promise.all(lifecycle.onBackFrom.map(fn => fn(current, target, options)))

    history.value = history.value.slice(0, history.value.length + delta)

    // 先执行全局的 onBackTo 生命周期函数，再执行组件内的 onBackTo 生命周期函数
    await Promise.all(lifecycle.onBackTo.map(fn => fn(target, current, options)))

    if (target) {
      await Promise.all(target.lifecycle?.onBackTo?.map(fn => fn(target, current, options)) ?? [])
    }
  }
  const replaceHistory = async (route: RouteLocation) => {
    // replace 的实现会有些反直觉，实现上需要先 push 新路由再移除原路由
    logger.info('replaceHistory', route)
    const newItem: RouteHistoryItem = markRaw({
      location: route,
      uniqueId: randomString()
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

  const oldPush = router.push.bind(router)
  router.push = async (...args: Parameters<typeof router.push>) => {
    const result = await oldPush(...args)
    const current = router.currentRoute.value;

    // 判断新的路由页面是否和上一个页面共用了同一个父组件，如果共用了，则把历史记录到父组件下面
    pushHistory(current)
    return result
  }

  const oldReplace = router.replace.bind(router)
  router.replace = async (...args: Parameters<typeof router.replace>) => {
    const result = await oldReplace(...args)
    replaceHistory(router.currentRoute.value)
    return result
  }

  return {
    ...router,
    history,
    install(app) {
      router.install.call(router, app)
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

appRouter.onForwardTo((to, from, options) => {
  if (options?.hasUAVisualTransition || disableAnim.value || !from || to.location.name === 'read') return;
  const list = Array.from(document.querySelectorAll('.c-history-page.current'))
  const cur = list.at(-1)
  const prev = cur?.previousElementSibling
  if (!cur || !prev) return;

  prev.animate([{ transform: `translateX(0)` }, { transform: `translateX(-30%)` }], { duration: 200, easing: 'ease-out' })
  cur.animate([{ transform: `translateX(100%)` }, { transform: `translateX(0)` }], { duration: 200, easing: 'ease-out' })
})

appRouter.onBackFrom((curRoute, prevRoute, options) => {
  if (options?.hasUAVisualTransition || disableAnim.value || curRoute.location.name === 'read') return;
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

const currentIsHome = () => appRouter.currentRoute.value.name === 'home-tab-shelf'

if (env.isAndroidApp()) {
  // Android 上监听后退按钮，执行路由后退、回到首页、退出应用
  let nextShouldExit = false
  onCloseRequest(() => {
    if (currentIsHome()) {
      if (nextShouldExit) {
        nextShouldExit = false
        return App.exitApp()
      }
      showToast('再按一次退出')
      nextShouldExit = true
      setTimeout(() => {
        nextShouldExit = false
      }, 2000)
      return;
    }
    if (typeof appRouter.currentRoute.value.name === 'string' && appRouter.currentRoute.value.name?.startsWith('home-tab-')) {
      appRouter.replace({ name: 'home-tab-shelf' })
      return;
    }
    window.history.back()
  })
}
