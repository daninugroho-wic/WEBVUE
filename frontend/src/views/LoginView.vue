<!-- src/views/Login.vue -->
<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          v-model="username"
          class="w-full mb-3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Username"
        />
        <input
          v-model="password"
          type="password"
          class="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Password"
        />
        <button
          @click="login"
          class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Login
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/store';
  
  const router = useRouter();
  const store = useAuthStore();
  let username = '', password = '';
  
  async function login() {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { username, password });
      store.setUser(res.data);
      router.push(res.data.role === 'admin' ? '/admin' : '/user');
    } catch (error) {
      alert('Login gagal. Periksa username/password.');
    }
  }
  </script>
  