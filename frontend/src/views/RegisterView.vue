<template>
  <!-- Overlay ketika sidebar mobile aktif -->
  <transition name="fade">
    <div v-if="sidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"></div>
  </transition>

  <!-- Toggle button untuk mobile -->
  <button @click="toggleSidebar" :aria-expanded="sidebarOpen.toString()" aria-controls="logo-sidebar" type="button"
    class="fixed top-4 left-4 z-40 inline-flex items-center p-2 text-gray-600 rounded-md bg-white shadow-md sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <span class="sr-only">Open sidebar</span>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Sidebar -->
  <aside id="logo-sidebar" :class="[
    'fixed top-0 left-0 z-40 h-full w-20 bg-white shadow-lg dark:bg-gray-900 transform transition-transform duration-300 ease-in-out overflow-y-auto sm:translate-x-0',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
  ]" aria-label="Sidebar">
    <div class="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
      <img src="https://flowbite.com/docs/images/logo.svg" alt="Logo" class="h-8 w-auto" />
    </div>

    <nav class="mt-5">
      <ul class="space-y-4 px-2">
        <li>
          <router-link to="/akses"
            class="flex justify-center items-center p-4 rounded-lg text-gray-700 hover:bg-indigo-100 dark:text-gray-300 dark:hover:bg-indigo-700 group"
            active-class="bg-indigo-200 dark:bg-indigo-800 font-semibold">
            <svg class="w-8 h-8 text-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
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

  <!-- Main content -->
  <div class="sm:ml-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Header -->
    <div class="pt-16 sm:pt-8 px-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Tambah Hak Akses</h1>
        <p class="text-lg text-gray-600">Buat akun baru untuk user sistem</p>
        <div class="mt-4 text-sm text-gray-500">
          <span>HighSpeed Internet By KabelTelekom</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-start mb-8">
        <router-link to="/akses">
          <button
            class="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-300 shadow-md flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </router-link>
      </div>

      <!-- Form Container -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Form Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 class="text-lg font-semibold text-gray-800">Hak Akses Baru</h3>
            <p class="text-sm text-gray-600 mt-1">Lengkapi informasi untuk membuat akun baru</p>
          </div>

          <!-- Form Body -->
          <div class="p-6">
            <form @submit.prevent="handleRegister" class="space-y-6">
              <!-- Grid Layout for Form Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Role Input -->
                <div>
                  <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
                    Role <span class="text-red-500">*</span>
                  </label>
                  <select id="role" v-model="role" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
                    <option value="helpdesk">Helpdesk</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <!-- Status Input -->
                <div>
                  <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                    Status <span class="text-red-500">*</span>
                  </label>
                  <select id="status" v-model="status" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
                    <option value="On">Aktif (On)</option>
                    <option value="Off">Tidak Aktif (Off)</option>
                  </select>
                </div>

                <!-- Username Input -->
                <div>
                  <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                    Username <span class="text-red-500">*</span>
                  </label>
                  <input id="username" v-model="username" type="text" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Masukkan username" />
                </div>

                <!-- Email Input -->
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email <span class="text-red-500">*</span>
                  </label>
                  <input id="email" v-model="email" type="email" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Masukkan email" />
                </div>

                <!-- Password Input -->
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                    Password <span class="text-red-500">*</span>
                  </label>
                  <input id="password" v-model="password" type="password" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Masukkan password (min. 6 karakter)" minlength="6" />
                </div>

                <!-- Confirm Password Input -->
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span class="text-red-500">*</span>
                  </label>
                  <input id="confirmPassword" v-model="confirmPassword" type="password" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Konfirmasi password" />
                </div>
              </div>

              <!-- Alamat Input (Full Width) -->
              <div>
                <label for="alamat" class="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea id="alamat" v-model="alamat"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Masukkan alamat lengkap (opsional)" rows="3"></textarea>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div class="flex">
                  <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                  <div>
                    <p class="font-medium">Error!</p>
                    <p class="text-sm">{{ errorMessage }}</p>
                  </div>
                </div>
              </div>

              <!-- Success Message -->
              <div v-if="successMessage"
                class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div class="flex">
                  <svg class="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd" />
                  </svg>
                  <div>
                    <p class="font-medium">Berhasil!</p>
                    <p class="text-sm">{{ successMessage }}</p>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <router-link to="/akses">
                  <button type="button"
                    class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200">
                    Batal
                  </button>
                </router-link>
                <button type="submit" :disabled="loading"
                  class="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-200 flex items-center">
                  <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  {{ loading ? 'Mendaftarkan...' : 'Buat Akun Baru' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const sidebarOpen = ref(false);
const role = ref('helpdesk');
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const alamat = ref('');
const status = ref('On');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Methods
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  router.replace({ path: '/' });
  window.location.reload();
}

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      role: role.value,
      alamat: alamat.value,
      status: status.value,
    });

    successMessage.value = 'Registrasi berhasil! User baru telah ditambahkan.';

    // Reset form
    username.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
    alamat.value = '';
    role.value = 'helpdesk';
    status.value = 'On';

    setTimeout(() => {
      router.push('/akses');
    }, 2000);

  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value = error.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.';
  } finally {
    loading.value = false;
  }
};
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