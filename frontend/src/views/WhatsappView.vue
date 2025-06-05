<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import WhatsappChat from "../components/WhatsappChat.vue"
import WhatsappContact from "@/components/contact/WhatsappContact.vue"

const socket = io('http://localhost:3000') // sesuaikan backend URL

const newMessage = ref(null)
const selectedContact = ref(null)

onMounted(() => {
  socket.on('connect', () => {
    console.log('Connected to backend socket:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  })
  
  socket.on("new-contact", (contact) => {
    if (!contacts.value.some((c) => c.whatsappId === contact.whatsappId)) {
      contacts.value.unshift(contact);
      saveContactsToLocalStorage();
    }
  })

  socket.on('new-message', (message) => {
    console.log('Pesan baru diterima:', message)
    newMessage.value = message

    // Jika belum ada kontak aktif, atau pesan dari kontak lain,
    // otomatis set selectedContact ke pengirim pesan baru agar chat update
    if (!selectedContact.value || selectedContact.value.contactNumber !== message.sender_id) {
      selectedContact.value = { contactNumber: message.sender_id }
    }
  })
})

onUnmounted(() => {
  socket.off('new-message')
  socket.disconnect()
})

// Fungsi menerima event dari child WhatsappContact saat kontak dipilih
function handleSelectContact(contact) {
  selectedContact.value = contact
}
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen">
    <div
      class="bg-white w-full md:w-72 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-gray-200 overflow-auto">
      <WhatsappContact :newMessage="newMessage" @select-contact="handleSelectContact" />
    </div>

    <div class="bg-gray-100 flex-1 h-2/3 md:h-full overflow-auto">
      <WhatsappChat :newMessage="newMessage" :selectedContact="selectedContact" />
    </div>
  </div>
</template>
