<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white p-8 rounded shadow">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
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
        <p v-if="errorMessage" class="text-red-600 mt-2 text-center">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.value = data.message || 'Login gagal';
    } else {
      // Simpan token atau data login sesuai backend
      localStorage.setItem('token', data.token);
      // Redirect atau update state login sesuai kebutuhan
      alert('Login berhasil!');
    }
  } catch (err) {
    errorMessage.value = 'Terjadi kesalahan jaringan';
  } finally {
    loading.value = false;
  }
}
</script>

<style>
/* Optional custom styles */
</style>
