<script setup>
import TelegramChat from "@/components/TelegramChat.vue"
import TelegramContact from "@/components/contact/TelegramContact.vue"
</script>

<template>
  <div class="flex h-screen">
    <!-- Komponen Kontak (Kanan) -->
    <div class="bg-white w-1/5">
      <TelegramContact />
    </div>
    <!-- Komponen Chat (Kiri) -->
    <div class="bg-gray-100 flex-auto">
      <TelegramChat />
    </div>
  </div>
</template>
