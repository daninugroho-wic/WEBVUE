<script setup>
import InstagramChat from "../components/InstagramChat.vue"
import InstagramContact from "@/components/contact/InstagramContact.vue"
</script>

<template>
  <div class="flex h-screen">
    <!-- Komponen Kontak (Kanan) -->
    <div class="bg-white w-1/5">
      <InstagramContact />
    </div>
    <!-- Komponen Chat (Kiri) -->
    <div class="bg-gray-100 flex-auto">
      <InstagramChat />
    </div>
  </div>
</template>
