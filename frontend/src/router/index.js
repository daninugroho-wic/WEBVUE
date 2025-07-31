import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Login
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

    // Admin Akses 
    {
      path: '/akses',
      name: 'akses',
      component: () => import('../views/page/AdminAksesView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },

    // Admin Laporan
    {
      path: '/laporan',
      name: 'laporan',
      component: () => import('../views/page/AdminLapView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
   
    // Helpdesk Laporan
    {
      path: '/laporans',
      name: 'laporans',
      component: () => import('../views/page/HelpdeskLapView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },
    {
      path: '/laporans/edit/:id',
      name: 'editLaporan',
      component: () => import('../views/page/HelpdeskEditView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },
    {
      path: '/form',
      name: 'form',
      component: () => import('../views/page/HelpdeskFormView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },

    // CHAT
    {
      path: '/whatsapp',
      name: 'whatsapp',
      component: () => import('../views/page/WhatsappView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/telegram',
      name: 'telegram',
      component: () => import('../views/page/TelegramView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/instagram',
      name: 'instagram',
      component: () => import('../views/page/InstagramView.vue'),
      meta: { requiresAuth: true },
    },

    // DASHBOARD
    {
      path: '/admins',
      name: 'admins',
      component: () => import('../views/role/AdminView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/helpdesks',
      name: 'helpdesks',
      component: () => import('../views/role/HelpdeskView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },
  ],
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const userRole = localStorage.getItem('role');
  const isAuthenticated = !!localStorage.getItem('token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/');
  } else if (to.meta.role && to.meta.role !== userRole) {
    next('/');
  } else {
    next();
  }
});

export default router;