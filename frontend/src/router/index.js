import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/whatsapp',
      name: 'whatsapp',
      component: () => import('../views/WhatsappView.vue'),
    },
    {
      path: '/telegram',
      name: 'telegram',
      component: () => import('../views/TelegramView.vue'),
    },
    {
      path: '/instagram',
      name: 'instagram',
      component: () => import('../views/InstagramView.vue'),
    },
  ],
})

export default router
