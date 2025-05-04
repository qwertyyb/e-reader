import { createRouter, createWebHashHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import BookListView from '@/views/BookListView.vue'
import ReadView from '@/views/ReadView.vue'
import BookSettingsView from '@/views/BookSettingsView.vue'
import ImportView from '@/views/ImportView.vue'

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
      path: '/settings/:id',
      name: 'bookSettings',
      props: true,
      component: BookSettingsView
    },
    {
      path: '/book/:id/notes',
      name: 'notes',
      props: true,
      component: () => import('@/views/NotesView.vue')
    },
    {
      path: '/test',
      name: 'test',
      props: true,
      component: ImportView
    }
  ],
})

export default router
