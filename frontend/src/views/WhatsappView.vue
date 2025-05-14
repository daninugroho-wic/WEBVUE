<script setup>
import WhatsappChat from "../components/WhatsappChat.vue"
import WhatsappContact from "@/components/contact/WhatsappContact.vue"
</script>

<template>
  <div class="flex h-screen">
    <!-- Komponen Kontak (Kanan) -->
    <div class="bg-white w-1/5">
      <WhatsappContact />
    </div>
    <!-- Komponen Chat (Kiri) -->
    <div class="bg-gray-100 flex-auto">
      <WhatsappChat />
    </div>
  </div>
</template>
