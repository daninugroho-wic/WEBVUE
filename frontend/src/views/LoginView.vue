<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-6 text-center text-blue-600">Login</h2>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="username" class="block mb-1 font-medium text-gray-700">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Masukkan username"
          />
        </div>
        <div>
          <label for="password" class="block mb-1 font-medium text-gray-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Masukkan password"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {{ loading ? 'Loading...' : 'Login' }}
        </button>
      </form>

      <!-- Error Message -->
      <p v-if="errorMessage" class="text-red-600 mt-2 text-center">{{ errorMessage }}</p>

      <!-- Register Button -->
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">Belum punya akun? <router-link to="/register" class="text-indigo-600 hover:underline">Daftar</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Username dan password wajib diisi!';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: username.value,
      password: password.value,
    });

    // Simpan token dan role ke localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', response.data.role);

    // Redirect berdasarkan role
    if (response.data.role === 'admin') {
      window.location.href = '/admin';
    } else if (response.data.role === 'helpdesk') {
      window.location.href = '/helpdesk';
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Gagal login';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Optional: Customize your form and button styles */
</style>
