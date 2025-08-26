<template>
  <!-- Sidebar Component -->
  <SidebarHelpdesk />

  <!-- Main Content Area - Full Screen -->
  <div class="flex h-screen w-full pl-0 sm:pl-20">
    <!-- Contact List Panel -->
    <div class="bg-white w-80 h-full border-r border-pink-200 flex flex-col">
      <InstagramContact :newMessage="newMessage" @select-contact="handleSelectContact" />
    </div>

    <!-- Chat Area - Takes remaining space -->
    <div class="bg-pink-50 flex-1 h-full flex flex-col">
      <InstagramChat :newMessage="newMessage" :selectedContact="selectedContact" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import InstagramChat from "@/components/InstagramChat.vue"
import InstagramContact from "@/components/contact/InstagramContact.vue"
import SidebarHelpdesk from "@/components/SidebarHelpdesks.vue"

const socket = io('http://localhost:3000')
const newMessage = ref(null)
const selectedContact = ref(null)

onMounted(() => {
  socket.on('connect', () => {
    console.log('Connected to backend socket:', socket.id)
  })

  socket.on('new-instagram-message', (message) => {
    console.log('📨 Pesan instagram baru diterima:', message)
    
    // PERBAIKAN: Pastikan message memiliki conversation_id
    if (!message.conversation_id) {
      console.warn('⚠️ Message tidak memiliki conversation_id:', message);
      return;
    }
    
    newMessage.value = message

    // Update selected contact jika perlu
    if (!selectedContact.value || selectedContact.value.contact_id !== message.sender_id) {
      selectedContact.value = { 
        contact_id: message.sender_id,
        conversation_id: message.conversation_id, // TAMBAHAN: Set conversation_id
        name: message.sender_name || message.sender_id
      }
    }
  })
})

onUnmounted(() => {
  socket.off('new-instagram-message') // Update event name
  socket.disconnect()
})

function handleSelectContact(contact) {
  selectedContact.value = contact
}
</script>

<style scoped>
/* Ensure full height */
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  height: 100vh;
}
</style>