import { createRouter, createWebHistory } from 'vue-router'
import Share from '../views/Share.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'share',
      component: Share
    },
  ]
})

export default router
