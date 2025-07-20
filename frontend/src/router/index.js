import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
     {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
     {
      path: '/akses',
      name: 'akses',
      component: () => import('../views/page/AdminAksesView.vue'),
    },
     {
      path: '/laporan',
      name: 'laporan',
      component: () => import('../views/page/AdminLapView.vue'),
    },
     {
      path: '/formakses',
      name: 'formakses',
      component: () => import('../views/page/FormAksesView.vue'),
    },
     {
      path: '/form',
      name: 'form',
      component: () => import('../views/page/HelpdeskFormView.vue'),
    },
     {
      path: '/laporans',
      name: 'laporans',
      component: () => import('../views/page/HelpdeskLapView.vue'),
    },
    {
      path: '/whatsapp',
      name: 'whatsapp',
      component: () => import('../views/page/WhatsappView.vue'),
    },
    {
      path: '/telegram',
      name: 'telegram',
      component: () => import('../views/page/TelegramView.vue'),
    },
    {
      path: '/instagram',
      name: 'instagram',
      component: () => import('../views/page/InstagramView.vue'),
    },

    {
      path: '/admins',
      name: 'admins',
      component: () => import('../views/role/AdminView.vue'),
    },
    {
      path: '/helpdesks',
      name: 'helpdesks',
      component: () => import('../views/role/HelpdeskView.vue'),
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const userRole = localStorage.getItem('role'); // Ambil role dari localStorage

  if (to.path === '/admin' && userRole !== 'admin') {
    next('/login'); // Redirect ke login jika bukan admin
  } else if (to.path === '/helpdesk' && userRole !== 'helpdesk') {
    next('/login'); // Redirect ke login jika bukan helpdesk
  } else {
    next(); // Lanjutkan ke route yang diminta
  }
});

export default router

