<template>
  <!-- Sidebar Component -->
  <SidebarHelpdesk />

  <!-- Main Content Area - Full Screen -->
  <div class="flex h-screen w-full pl-0 sm:pl-20">
    <!-- Contact List Panel -->
    <div class="bg-white w-80 h-full border-r border-blue-200 flex flex-col">
      <TelegramContact 
        :newMessage="newMessage" 
        @select-contact="handleSelectContact" 
      />
    </div>

    <!-- Chat Area - Takes remaining space -->
    <div class="bg-blue-50 flex-1 h-full flex flex-col">
      <TelegramChat 
        :newMessage="newMessage" 
        :selectedContact="selectedContact"
        @message-sent="handleMessageSent"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import TelegramChat from "@/components/TelegramChat.vue"
import TelegramContact from "@/components/contact/TelegramContact.vue"
import SidebarHelpdesk from "@/components/SidebarHelpdesks.vue"

const socket = io('http://localhost:3000')
const newMessage = ref(null)
const selectedContact = ref(null)

// Handle socket events
onMounted(() => {
  console.log('🔌 Connecting to Telegram socket...')
  
  // ✅ UPDATE: Listen sesuai dengan backend emit
  socket.on('new-telegram-message', (data) => {
    console.log('📨 New Telegram message received:', data)
    newMessage.value = {
      conversation_id: data.conversation_id,
      message_id: data.message_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      text: data.text,
      timestamp: data.timestamp,
      platform: 'telegram'
    }
  })

  // Socket connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected to Telegram service')
  })

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected from Telegram service')
  })

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error)
  })
})

onUnmounted(() => {
  console.log('🔌 Disconnecting from Telegram socket...')
  socket.off('new-telegram-message')
  socket.off('connect')
  socket.off('disconnect')
  socket.off('error')
  socket.disconnect()
})

// Handle contact selection
function handleSelectContact(contact) {
  console.log('👤 Contact selected:', contact)
  selectedContact.value = contact
  newMessage.value = null // Reset new message when switching contacts
}

// Handle message sent
function handleMessageSent(messageData) {
  console.log('📤 Message sent:', messageData)
  // ✅ UPDATE: Emit sesuai backend expectation
  socket.emit('telegram-message-sent', {
    message_id: messageData.message_id,
    text: messageData.text,
    chat_id: messageData.chat_id,
    timestamp: messageData.timestamp,
    platform: 'telegram'
  })
}
</script>

<style scoped>
/* Custom styles untuk Telegram view */
.telegram-container {
  height: 100vh;
  overflow: hidden;
}
</style>
