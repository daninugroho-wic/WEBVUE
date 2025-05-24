<template>
    <div class="h-full w-full bg-red-100 shadow-lg p-4">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Contact Instagram</h2>
      
      <!-- Daftar Kontak -->
      <div v-for="(contact, index) in contacts" :key="index" 
           class="flex items-center gap-3 p-3 border-b hover:bg-gray-100 cursor-pointer">
        <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          👤
        </div>
        <div>
          <p class="font-medium text-gray-800">{{ contact.name }}</p>
          <p class="text-sm text-gray-500">{{ contact.lastMessage }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
   
  const contacts = ref([
    { name: "Dani Nugroho", lastMessage: "Halo, apa kabar?" },
    { name: "Wicaksono", lastMessage: "Lagi sibuk?" },
    { name: "Budi Santoso", lastMessage: "Ayo ketemu besok!" }
  ]);
  </script>
  