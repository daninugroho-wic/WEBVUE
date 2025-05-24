<script setup>
import WhatsappChat from "../components/WhatsappChat.vue"
import WhatsappContact from "@/components/contact/WhatsappContact.vue"
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen">
    <!-- Sidebar Kontak -->
    <div class="bg-white w-full md:w-72 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-gray-200 overflow-auto">
      <WhatsappContact />
    </div>

    <!-- Area Chat -->
    <div class="bg-gray-100 flex-1 h-2/3 md:h-full overflow-auto">
      <WhatsappChat />
    </div>
  </div>
</template>
