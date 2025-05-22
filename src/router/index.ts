import { createRouter, createWebHashHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import BookListView from '@/views/BookListView.vue'
import ReadView from '@/views/ReadView.vue'
import ImportView from '@/views/ImportView.vue'
import AIChatView from '@/views/AIChatView.vue'
import PreferencesView from '@/views/PreferencesView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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

export default router
