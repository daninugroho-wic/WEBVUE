<template>
  <!-- Toggle button untuk mobile -->
  <button @click="toggleSidebar" :aria-expanded="sidebarOpen.toString()" aria-controls="logo-sidebar" type="button"
    class="fixed top-4 left-4 z-50 inline-flex items-center p-2 text-gray-600 rounded-md bg-white shadow-md sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <span class="sr-only">Open sidebar</span>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Overlay ketika sidebar mobile aktif -->
  <transition name="fade">
    <div v-if="sidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"></div>
  </transition>

  <!-- Sidebar -->
  <aside
    id="logo-sidebar"
    class="no-print fixed top-0 left-0 z-40 h-screen w-20 bg-white shadow-lg dark:bg-gray-900 transform transition-transform duration-300 ease-in-out overflow-y-auto sm:translate-x-0"
    :class="[
      sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
    ]"
    aria-label="Sidebar"
  >
    <div class="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
      <img src="/images/maxnet.png" alt="Logo" class="h-8 w-auto" />
    </div>

    <nav class="mt-5">
      <ul class="space-y-4 px-2">
        <li>
          <router-link to="/admins"
            class="flex justify-center items-center p-4 rounded-lg text-gray-700 hover:bg-indigo-100 dark:text-gray-300 dark:hover:bg-indigo-700 group"
            active-class="bg-indigo-200 dark:bg-indigo-800 font-semibold">
            <svg class="w-8 h-8 text-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24">
              <path
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link to="/akses"
            class="flex justify-center items-center p-4 rounded-lg text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-800 group"
            active-class="bg-purple-200 dark:bg-purple-900 font-semibold">
            <svg class="w-8 h-8 text-purple-500 group-hover:text-purple-700 dark:group-hover:text-purple-300"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link to="/laporan"
            class="flex justify-center items-center p-4 rounded-lg text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800 group"
            active-class="bg-blue-200 dark:bg-blue-900 font-semibold">
            <svg class="w-8 h-8 text-blue-500 group-hover:text-blue-700 dark:group-hover:text-blue-300" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </router-link>
        </li>

        <li>
          <button @click="handleLogout"
            class="flex justify-center items-center p-4 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800 group w-full">
            <svg class="w-8 h-8 text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span class="sr-only">Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  router.replace({ path: '/' })
  window.location.reload()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
<style>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>