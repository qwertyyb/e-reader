import { createRouter, createWebHashHistory } from 'vue-router'
import TabView from '@/views/TabView.vue'
import BookListView from '@/views/BookListView.vue'

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
        }
      ]
    },
    {
      path: '/read/:id',
      name: 'read',
      props: true,
      component: () => import('@/views/ReadView.vue')
    },
    {
      path: '/book/:id/notes',
      name: 'notes',
      props: true,
      component: () => import('@/views/NotesView.vue')
    }
  ],
})

export default router
