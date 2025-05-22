import { createRouter, createWebHashHistory, type RouterHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import BookListView from '@/views/BookListView.vue'
import ReadView from '@/views/ReadView.vue'
import ImportView from '@/views/ImportView.vue'
import AIChatView from '@/views/AIChatView.vue'
import PreferencesView from '@/views/PreferencesView.vue'
import { ref } from 'vue'

export const transitionName = ref('')
let curIsRead = false

const history = createWebHashHistory(import.meta.env.BASE_URL)

const appHistory: RouterHistory = {
  base: history.base,
  location: history.location,
  state: history.state,
  destroy() {
    history.destroy()
  },
  push(to, data) {
    if (to.startsWith('/read/')) {
      // 跳转去阅读界面的动画是自定义的，所以无须使用这里的过渡
      curIsRead = true
      transitionName.value = ''
    } else {
      transitionName.value = 'slide-left'
    }
    return history.push(to, data)
  },
  replace(to, data) {
    transitionName.value = ''
    return history.replace(to, data)
  },
  go(delta) {
    if (curIsRead) {
      // 从阅读界面退出的动画是自定义的，无须使用这里的过渡
      transitionName.value = ''
    } else {
      transitionName.value = delta > 0 ? 'slide-left' : 'slide-right'
    }
    return history.go(delta)
  },
  createHref(location) {
    return history.createHref(location)
  },
  listen(cb) {
    return history.listen(cb)
  }
}

const router = createRouter({
  history: appHistory,
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
    }
  ],
})

// const originPush = router.push
// router.push = (to: RouteLocationRaw) => {
//   console.log('push route')
//   // transitionName.value = 'slide-left'
//   return originPush(to)
// }



router.push(location.hash.replace('#', '') || '/')

export default router
