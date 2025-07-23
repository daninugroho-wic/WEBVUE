import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';

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
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/laporan',
      name: 'laporan',
      component: () => import('../views/page/AdminLapView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/formakses',
      name: 'formakses',
      component: () => import('../views/page/FormAksesView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/form',
      name: 'form',
      component: () => import('../views/page/HelpdeskFormView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },
    {
      path: '/laporans',
      name: 'laporans',
      component: () => import('../views/page/HelpdeskLapView.vue'),
      meta: { requiresAuth: true, role: 'helpdesk' },
    },
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
  const userRole = localStorage.getItem('role'); // Ambil role dari localStorage
  const isAuthenticated = !!localStorage.getItem('token'); // Periksa apakah user sudah login

  // Jika halaman memerlukan otentikasi
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/'); // Redirect ke login jika belum login
  } else if (to.meta.role && to.meta.role !== userRole) {
    // Jika halaman membutuhkan role tertentu
    next('/'); // Redirect ke login jika role tidak sesuai
  } else {
    next(); // Lanjutkan ke halaman yang diminta
  }
});

export default router;
