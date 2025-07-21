<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
    <div class="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-blue-600">Register</h1>
        <p class="text-center text-gray-500">HighSpeed Internet By KabelTelekom.</p>
      </div>

      <!-- Form Register -->
      <form @submit.prevent="handleRegister" class="space-y-6">
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

        <!-- Email Input -->
        <div>
          <label for="email" class="block mb-1 font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-300"
            placeholder="Masukkan email"
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

        <!-- Confirm Password Input -->
        <div>
          <label for="confirmPassword" class="block mb-1 font-medium text-gray-700">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-300"
            placeholder="Konfirmasi password"
          />
        </div>

        <!-- Sign Up Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-300 transform hover:scale-105"
        >
          {{ loading ? 'Loading...' : 'Sign Up' }}
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Sudah punya akun? 
          <router-link to="/" class="text-indigo-600 hover:underline">Masuk Sekarang</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleRegister = async () => {
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Semua kolom wajib diisi!';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Password dan konfirmasi password tidak cocok!';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    });

    // Redirect to login page after successful registration
    router.push('/login');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Gagal mendaftar';
  } finally {
    loading.value = false;
  }
};
</script>