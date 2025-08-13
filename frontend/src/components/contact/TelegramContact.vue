<template>
  <div class="h-full w-full bg-blue-50 shadow-xl p-3 sm:p-5 flex flex-col">
    <!-- Bagian atas: Judul & Info Bot -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6 border-b border-blue-300 pb-2">TELEGRAM</h2>
      <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-blue-100 border border-blue-300 rounded-xl shadow-inner">
        <div class="w-12 h-12 sm:w-14 sm:h-14 bg-blue-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none" aria-label="Bot icon">
          🤖
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-blue-900 tracking-wide select-text text-sm sm:text-base">Bot Telegram</p>
          <p class="text-blue-700 text-xs sm:text-sm tracking-wide select-text truncate">{{ botStatus }}</p>
          <p class="text-blue-600 text-xs mt-1">Status Bot Telegram</p>
        </div>
      </div>
    </div>

    <!-- Bagian bawah: Daftar Kontak -->
    <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-2 sm:gap-3 hide-scrollbar">
      <div v-if="contacts.length === 0" class="flex items-center justify-center h-32 text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-sm">Belum ada kontak</p>
        </div>
      </div>

      <div v-else v-for="contact in filteredContacts" :key="contact.contact_id"
        class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-blue-100 cursor-pointer transition-colors"
        :class="{ 'bg-blue-100': selectedContactId === contact.contact_id }"
        role="button" tabindex="0" @click="selectContact(contact)" @keydown.enter="selectContact(contact)">
        <div class="w-12 h-12 sm:w-14 sm:h-14 bg-blue-300 rounded-full flex items-center justify-center text-blue-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0" aria-label="User icon">
          {{ (contact.contact_name || contact.contact_id || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex flex-col overflow-hidden min-w-0 flex-1">
          <p class="font-semibold text-blue-900 truncate select-text text-sm sm:text-base">
            {{ contact.contact_name || contact.contact_id }}
          </p>
          <p class="text-blue-700 text-xs sm:text-sm truncate select-text" :title="contact.last_message">
            {{ contact.last_message || 'Tidak ada pesan' }}
          </p>
          <p class="text-blue-600 text-xs">
            {{ formatTime(contact.last_message_time) }}
          </p>
          <div v-if="contact.unread_count > 0" class="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{ contact.unread_count }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import axios from "axios"

const contacts = ref([])
const searchQuery = ref('')
const loading = ref(false)
const selectedContactId = ref(null)
const botStatus = ref('Connected')

const emit = defineEmits(["select-contact"])
const props = defineProps({
  newMessage: Object
})

// Computed
const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  
  const query = searchQuery.value.toLowerCase()
  return contacts.value.filter(contact => 
    (contact.contact_name && contact.contact_name.toLowerCase().includes(query)) ||
    contact.contact_id.includes(query)
  )
})

// Methods
function formatTime(timestamp) {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diffInHours < 48) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }
}

async function fetchContacts() {
  loading.value = true
  try {
    const { data } = await axios.get("http://localhost:3000/api/telegram/contacts")
    
    if (data.success) {
      // ✅ UPDATE: Sesuaikan dengan response backend
      contacts.value = data.contacts.map(contact => ({
        conversation_id: contact.conversation_id,
        contact_id: contact.telegramId,      // Backend: telegramId
        contact_name: contact.name,          // Backend: name
        last_message: contact.lastMessage,   // Backend: lastMessage
        last_message_time: contact.lastTimestamp, // Backend: lastTimestamp
        unread_count: contact.unreadCount || 0,   // Backend: unreadCount
        platform: 'telegram'
      }))
      saveContactsToLocalStorage()
      console.log('✅ Telegram contacts loaded:', contacts.value.length)
    }
  } catch (error) {
    console.error("❌ Failed to fetch Telegram contacts:", error)
    loadContactsFromLocalStorage()
    
    // Load dummy data if no local storage
    if (contacts.value.length === 0) {
      contacts.value = [
        {
          conversation_id: "dummy_conv_1",
          contact_id: "123456789",
          contact_name: "Demo User",
          last_message: "Hello from Telegram!",
          last_message_time: new Date().toISOString(),
          unread_count: 1,
          platform: 'telegram'
        }
      ]
    }
  } finally {
    loading.value = false
  }
}

function loadContactsFromLocalStorage() {
  const storedContacts = localStorage.getItem('telegram_contacts')
  if (storedContacts) {
    contacts.value = JSON.parse(storedContacts)
  }
}

function saveContactsToLocalStorage() {
  localStorage.setItem('telegram_contacts', JSON.stringify(contacts.value))
}

function selectContact(contact) {
  selectedContactId.value = contact.contact_id
  emit("select-contact", contact)
  
  // Mark as read when selecting contact
  markContactAsRead(contact.contact_id)
}

async function markContactAsRead(contactId) {
  const contactIndex = contacts.value.findIndex(c => c.contact_id === contactId)
  if (contactIndex !== -1 && contacts.value[contactIndex].unread_count > 0) {
    contacts.value[contactIndex].unread_count = 0
    saveContactsToLocalStorage()
    
    // ✅ UPDATE: Kirim conversation_id ke backend
    const conversationId = contacts.value[contactIndex].conversation_id
    if (!conversationId) return
    
    try {
      await axios.put(`http://localhost:3000/api/telegram/read/${conversationId}`)
    } catch (error) {
      console.error('❌ Failed to mark as read:', error)
    }
  }
}

// ✅ UPDATE: Watch for new messages sesuai backend emit
watch(() => props.newMessage, (msg) => {
  if (!msg || !msg.sender_id) return

  const contactIndex = contacts.value.findIndex(c => 
    c.contact_id === msg.sender_id || 
    c.contact_id === msg.chat_id
  )

  if (contactIndex !== -1) {
    // Update existing contact
    contacts.value[contactIndex].last_message = msg.text
    contacts.value[contactIndex].last_message_time = msg.timestamp || new Date().toISOString()
    
    // Only increment unread if not currently selected
    if (selectedContactId.value !== contacts.value[contactIndex].contact_id) {
      contacts.value[contactIndex].unread_count += 1
    }
    
    // Move to top
    const updatedContact = contacts.value.splice(contactIndex, 1)[0]
    contacts.value.unshift(updatedContact)
  } else {
    // ✅ UPDATE: Add new contact sesuai backend structure
    const newContact = {
      conversation_id: msg.conversation_id,
      contact_id: msg.sender_id || msg.chat_id,
      contact_name: msg.sender_name || msg.sender_id,
      last_message: msg.text,
      last_message_time: msg.timestamp || new Date().toISOString(),
      unread_count: 1,
      platform: 'telegram'
    }
    
    contacts.value.unshift(newContact)
  }
  
  saveContactsToLocalStorage()
})

// Lifecycle
onMounted(() => {
  loadContactsFromLocalStorage()
  fetchContacts()
})
</script>

<style scoped>
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>