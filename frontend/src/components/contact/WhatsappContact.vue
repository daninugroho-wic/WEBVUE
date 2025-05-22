<template>
<div class="fixed top-0 left-0 h-full w-full sm:w-64 bg-green-50 shadow-lg p-4 overflow-y-auto">
    <h2 class="text-lg font-semibold text-gray-700 mb-4">WHATSAPP</h2>
    <div class="flex items-center gap-3 p-4 mb-4 bg-green-100 border border-green-300 rounded-lg">
        <div class="w-12 h-12 bg-green-300 rounded-full flex items-center justify-center text-white font-bold">
            📞
        </div>
        <div>
            <p class="font-medium text-green-800">Nomor Perusahaan</p>
            <p class="text-sm text-green-600">{{ companyPhone }}</p>
        </div>
    </div>

    <!-- Daftar Kontak -->
    <div v-for="(contact, index) in contacts" :key="index" class="flex items-center gap-3 p-3 border-b hover:bg-green-200 rounded-lg cursor-pointer">
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
import {
    ref
} from "vue";
// Nomor perusahaan
const companyPhone = ref("+62 838-6647-4123");
const contacts = ref([{
        name: "Dani Nugroho",
        lastMessage: "Halo, apa kabar?"
    },
    {
        name: "Wicaksono",
        lastMessage: "Lagi sibuk?"
    },
    {
        name: "Budi Santoso",
        lastMessage: "Ayo ketemu besok!"
    }
]);
</script>
