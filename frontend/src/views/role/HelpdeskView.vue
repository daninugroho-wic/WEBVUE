<script setup>
import { ref } from 'vue';

const sidebarOpen = ref(false);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
</script>

<template>
  <!-- Overlay ketika sidebar mobile aktif -->
  <transition name="fade">
    <div
      v-if="sidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"
    ></div>
  </transition>

  <!-- Toggle button untuk mobile -->
  <button
    @click="toggleSidebar"
    :aria-expanded="sidebarOpen.toString()"
    aria-controls="logo-sidebar"
    type="button"
    class="fixed top-4 left-4 z-40 inline-flex items-center p-2 text-gray-600 rounded-md bg-white shadow-md sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <span class="sr-only">Open sidebar</span>
    <svg
      class="w-6 h-6"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Sidebar -->
  <aside
    id="logo-sidebar"
    :class="[ 
      'fixed top-0 left-0 z-40 h-full w-20 bg-white shadow-lg dark:bg-gray-900 transform transition-transform duration-300 ease-in-out overflow-y-auto sm:translate-x-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Sidebar"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <a href="https://flowbite.com/" class="flex items-center">
        <img
          src="https://flowbite.com/docs/images/logo.svg"
          alt="Logo"
          class="h-8 w-auto"
        />
      </a>
      <button
        @click="toggleSidebar"
        class="sm:hidden text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        aria-label="Close sidebar"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="mt-5">
      <ul class="space-y-4 px-2">
        <li>
          <router-link
            to="/helpdesks"
            class="flex justify-center items-center p-4 rounded-lg text-gray-700 hover:bg-indigo-100 dark:text-gray-300 dark:hover:bg-indigo-700 group"
            active-class="bg-indigo-200 dark:bg-indigo-800 font-semibold"
          >
            <svg
              class="w-8 h-8 text-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
              <path d="M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link
            to="/whatsapp"
            class="flex justify-center items-center p-4 rounded-lg text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-800 group"
            active-class="bg-green-200 dark:bg-green-900 font-semibold"
          >
            <svg
              class="w-8 h-8 text-green-500 group-hover:text-green-700 dark:group-hover:text-green-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 3H4a1 1 0 00-1 1v14l4-4h9a1 1 0 001-1V4a1 1 0 00-1-1z"
              />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link
            to="/instagram"
            class="flex justify-center items-center p-4 rounded-lg text-pink-600 hover:bg-pink-100 dark:text-pink-400 dark:hover:bg-pink-800 group"
            active-class="bg-pink-200 dark:bg-pink-900 font-semibold"
          >
            <svg
              class="w-8 h-8 text-pink-500 group-hover:text-pink-700 dark:group-hover:text-pink-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 2C4.8 2 3 3.8 3 6v12c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4H7zm0 2h10c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              />
              <circle cx="12" cy="12" r="3.2" />
              <circle cx="17.5" cy="6.5" r="1.5" />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link
            to="/telegram"
            class="flex justify-center items-center p-4 rounded-lg text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800 group"
            active-class="bg-blue-200 dark:bg-blue-900 font-semibold"
          >
            <svg
              class="w-8 h-8 text-blue-500 group-hover:text-blue-700 dark:group-hover:text-blue-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21.7 4.3a1 1 0 00-1.4-1.4L3.2 20.9a1 1 0 00.3 1.6l4.9 2.6a1 1 0 001.3-.5L14 14l7-7a1 1 0 000-1.4z"
              />
            </svg>
          </router-link>
        </li>

        <li>
          <router-link
            to="/login"
            class="flex justify-center items-center p-4 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 group"
            active-class="bg-gray-200 dark:bg-gray-800 font-semibold"
          >
            <svg
              class="w-8 h-8 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <path d="M10 17l5-5-5-5v10z" />
            </svg>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- Main content -->
  <div
  class=" p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
  :class="{'ml-0': !sidebarOpen, 'sm:ml-64': sidebarOpen}"
>
  <router-view />
</div>

</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>