<template>
  <div class="h-full w-full bg-pink-50 shadow-xl p-3 sm:p-5 flex flex-col">
    <!-- Bagian atas: Judul & Username Perusahaan -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-pink-900 mb-4 sm:mb-6 border-b border-pink-300 pb-2">INSTAGRAM</h2>
      <div
        class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-pink-100 border border-pink-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-default">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 bg-pink-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none"
          aria-label="Instagram icon">
          📷
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-pink-900 tracking-wide select-text text-sm sm:text-base">Instagram Perusahaan</p>
          <p class="text-pink-700 text-xs sm:text-sm tracking-wide select-text truncate">{{ companyInstagram }}</p>
          <p class="text-pink-600 text-xs mt-1">Akun resmi perusahaan</p>
        </div>
      </div>
    </div>

    <!-- Bagian bawah: Daftar Kontak, ini scrollable -->
    <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-2 sm:gap-3 hide-scrollbar">
      <div v-if="contacts.length === 0" class="flex items-center justify-center h-32 text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
          </svg>
          <p class="text-sm">Belum ada kontak</p>
        </div>
      </div>

      <div v-else v-for="(contact, index) in contacts" :key="contact.contact_id || index"
        class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-pink-100 cursor-pointer transition-colors"
        role="button" tabindex="0" @click="selectContact(contact)" @keydown.enter="selectContact(contact)">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 bg-pink-300 rounded-full flex items-center justify-center text-pink-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0"
          aria-label="User icon">
          {{ (contact.name || contact.contact_id || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex flex-col overflow-hidden min-w-0 flex-1">
          <p class="font-semibold text-pink-900 truncate select-text text-sm sm:text-base">
            {{ contact.name || contact.contact_id }}
          </p>
          <p class="text-pink-700 text-xs sm:text-sm truncate select-text" :title="contact.lastMessage">
            {{ contact.lastMessage || 'Tidak ada pesan' }}
          </p>
          <p class="text-pink-600 text-xs">
            {{ formatTime(contact.lastTimestamp) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"
import axios from "axios"

const companyInstagram = ref("@perusahaan_official")
const contacts = ref([])

const emit = defineEmits(["select-contact"])
const props = defineProps({ newMessage: Object })

function loadContactsFromLocalStorage() {
  const storedContacts = localStorage.getItem('instagram_contacts')
  if (storedContacts) {
    contacts.value = JSON.parse(storedContacts)
  }
}

async function fetchContacts() {
  try {
    const { data } = await axios.get("http://localhost:3000/api/instagram/contacts")
    if (data.success) {
      contacts.value = data.contacts.map(contact => ({
        conversation_id: contact.conversation_id, // Pastikan ini ada
        contact_id: contact.contact_id,
        name: contact.name || contact.contact_id,
        lastMessage: contact.lastMessage || 'Tidak ada pesan',
        lastTimestamp: contact.lastTimestamp || null,
        unreadCount: contact.unreadCount || 0
      }))
      
      // PERBAIKAN: Log untuk debugging
      console.log('📋 Fetched contacts:', contacts.value);
      
      saveContactsToLocalStorage()
    }
  } catch (error) {
    console.error("Gagal mengambil kontak:", error)
  }
}

function saveContactsToLocalStorage() {
  localStorage.setItem('instagram_contacts', JSON.stringify(contacts.value))
}

async function saveContactToDatabase(contact) {
  try {
    await axios.post("http://localhost:3000/api/instagram/contacts", {
      contact_id: contact.contact_id,
      name: contact.name,
      last_message: contact.lastMessage,
      last_message_time: contact.lastTimestamp
    })
  } catch (error) {
    console.error("Gagal menyimpan kontak baru ke database:", error)
  }
}

watch(() => props.newMessage, (msg) => {
  if (!msg || !msg.sender_id) return

  const idx = contacts.value.findIndex((c) => c.contact_id === msg.sender_id)

  if (idx !== -1) {
    // Update existing contact
    contacts.value[idx].lastMessage = msg.text
    contacts.value[idx].lastTimestamp = msg.timestamp
    contacts.value[idx].conversation_id = msg.conversation_id // TAMBAHAN: Update conversation_id
    
    const updatedContact = contacts.value.splice(idx, 1)[0]
    contacts.value.unshift(updatedContact)
    saveContactsToLocalStorage()
  } else {
    // Create new contact
    const newContact = {
      conversation_id: msg.conversation_id, // PENTING: Pastikan ini ada
      contact_id: msg.sender_id,
      lastMessage: msg.text,
      lastTimestamp: msg.timestamp,
      name: msg.sender_name || msg.sender_id,
      unreadCount: 0
    }
    
    console.log('➕ Adding new contact:', newContact);
    
    contacts.value.unshift(newContact)
    saveContactsToLocalStorage()
    saveContactToDatabase(newContact)
  }
})

function selectContact(contact) {
  emit("select-contact", contact)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadContactsFromLocalStorage()
  fetchContacts()
})
</script>