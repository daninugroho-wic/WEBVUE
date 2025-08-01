<template>
  <!-- Sidebar Component -->
  <Sidebar />

  <!-- Main Content Area - Full Screen -->
  <div class="flex h-screen w-full pl-0 sm:pl-20">
    <!-- Contact List Panel -->
    <div class="bg-white w-80 h-full border-r border-gray-200 flex flex-col">
      <WhatsappContact 
        :newMessage="newMessage" 
        @select-contact="handleSelectContact"
        @show-company-qr="handleShowCompanyQR" 
      />
    </div>

    <!-- Chat Area - Takes remaining space -->
    <div class="bg-gray-100 flex-1 h-full flex flex-col">
      <WhatsappChat 
        :newMessage="newMessage" 
        :selectedContact="selectedContact"
        :showCompanyQR="companyQRData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import WhatsappChat from "@/components/WhatsappChat.vue"
import WhatsappContact from "@/components/contact/WhatsappContact.vue"
import Sidebar from "@/components/SidebarHelpdesks.vue"

const socket = io('http://localhost:3000', { transports: ['websocket'] })
const newMessage = ref(null)
const selectedContact = ref(null)
const companyQRData = ref(null)

onMounted(() => {
  socket.on('connect', () => {
    console.log('✅ WhatsApp Socket Connected:', socket.id)
  })

  // Listen for new WhatsApp messages (dari orang lain)
  socket.on('new-message', (message) => {
    console.log('📨 Received new-message:', message)
    if (message.platform === 'whatsapp') {
      newMessage.value = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      }
      
      // Auto-select contact if not selected
      if (!selectedContact.value || selectedContact.value.whatsappId !== message.sender_id) {
        selectedContact.value = { 
          whatsappId: message.sender_id,
          contactNumber: message.sender_id,
          name: message.sender_id.replace('@c.us', '')
        }
      }
    }
  })

  // Listen for sent messages (dari kita sendiri) - TAMBAHAN INI
  socket.on('message-sent', (message) => {
    console.log('📤 Received message-sent:', message)
    if (message.platform === 'whatsapp') {
      newMessage.value = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      }
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ WhatsApp Socket Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('🔴 WhatsApp Connection error:', error)
  })
})

onUnmounted(() => {
  socket.off('new-message')
  socket.off('message-sent')
  socket.disconnect()
})

function handleSelectContact(contact) {
  selectedContact.value = contact
  companyQRData.value = null
}

function handleShowCompanyQR(qrData) {
  selectedContact.value = null
  companyQRData.value = qrData
}
</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  height: 100vh;
}
</style>
