<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
    <div class="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg flex space-x-6">
      <!-- Form Area -->
      <div class="w-1/2 p-6 space-y-6">
        <h2 class="text-3xl font-bold text-center text-indigo-600">Maxnet</h2>
        <p class="text-center text-gray-500">HighSpeed Internet By KabelTelekom.</p>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username Input -->
          <div>
            <label for="username" class="block mb-1 font-medium text-gray-700">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-300"
              placeholder="Masukkan username"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block mb-1 font-medium text-gray-700">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-300"
              placeholder="Masukkan password"
            />
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-300 transform hover:scale-105"
          >
            {{ loading ? 'Loading...' : 'Sign In' }}
          </button>
        </form>

        <!-- Sign Up Link -->
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">
            Belum punya akun? 
            <router-link to="/register" class="text-indigo-600 hover:underline">Daftar Sekarang</router-link>
          </p>
        </div>
      </div>

      <!-- Image Area -->
      <div class="w-1/1 flex items-center justify-center rounded-lg overflow-hidden">
        <img src="/images/login.png"/>
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