<template>
  <div class="h-full w-full bg-green-50 shadow-xl p-3 sm:p-5 flex flex-col">
    <!-- =============== HEADER SECTION =============== -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-green-900 mb-4 sm:mb-6 border-b border-green-300 pb-2">
        WHATSAPP
      </h2>

      <!-- Company WhatsApp Info -->
      <div @click="showCompanyQR"
        class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-green-100 border border-green-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-pointer hover:bg-green-200">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 bg-green-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none"
          aria-label="Phone icon">
          📞
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-green-900 tracking-wide select-text text-sm sm:text-base">
            Nomor Perusahaan
          </p>
          <p class="text-green-700 text-xs sm:text-sm tracking-wide select-text truncate">
            {{ companyPhone }}
          </p>
          <p class="text-green-600 text-xs mt-1">
            Klik untuk ganti nomor
          </p>
        </div>
      </div>
    </div>

    <!-- =============== CONTACTS SECTION =============== -->
    <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-2 sm:gap-3 hide-scrollbar">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="contacts.length === 0" class="flex items-center justify-center h-32 text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
          </svg>
          <p class="text-sm font-medium">Belum ada kontak</p>
          <p class="text-xs text-gray-400 mt-1">Kontak akan muncul saat ada pesan masuk</p>
        </div>
      </div>

      <!-- Contacts List -->
      <div v-else class="space-y-2 sm:space-y-3">
        <div v-for="(contact, index) in contacts" :key="contact.whatsappId || contact.contactNumber || index"
          class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-green-100 cursor-pointer transition-colors group"
          :class="{ 'bg-green-100': selectedContactId === (contact.whatsappId || contact.contactNumber) }" role="button"
          tabindex="0" @click="selectContact(contact)" @keydown.enter="selectContact(contact)">
          <!-- Contact Avatar -->
          <div
            class="w-12 h-12 sm:w-14 sm:h-14 bg-green-300 rounded-full flex items-center justify-center text-green-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0"
            aria-label="User icon">
            {{ getContactInitial(contact) }}
          </div>

          <!-- Contact Info -->
          <div class="flex flex-col overflow-hidden min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-green-900 truncate select-text text-sm sm:text-base">
                {{ getContactName(contact) }}
              </p>
              <p class="text-green-600 text-xs flex-shrink-0 ml-2">
                {{ formatTime(contact.lastTimestamp) }}
              </p>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-green-700 text-xs sm:text-sm truncate select-text" :title="contact.lastMessage">
                {{ contact.lastMessage || 'Tidak ada pesan' }}
              </p>

              <!-- Unread Count Badge -->
              <div v-if="contact.unreadCount > 0"
                class="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 ml-2">
                {{ contact.unreadCount > 99 ? '99+' : contact.unreadCount }}
              </div>
            </div>

            <!-- Contact Number -->
            <p class="text-green-600 text-xs mt-1 truncate">
              {{ contact.phoneNumber || contact.contactNumber }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"
import axios from "axios"

// =============== PROPS & EMITS ===============
const props = defineProps({
  newMessage: Object
})

const emit = defineEmits(['select-contact', 'show-company-qr'])

// =============== REACTIVE STATE ===============
const contacts = ref([])
const companyPhone = ref("+62 838-6647-4123")
const isLoading = ref(false)
const selectedContactId = ref(null)

// =============== CONSTANTS ===============
const STORAGE_KEY = 'whatsapp_contacts'
const API_BASE_URL = "http://localhost:3000/api"

// =============== UTILITY FUNCTIONS ===============
const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const now = new Date()
  const date = new Date(timestamp)
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Baru saja'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  })
}

const getContactName = (contact) => {
  return contact.name ||
    contact.whatsappId?.replace('@c.us', '') ||
    contact.contactNumber?.replace('@c.us', '') ||
    'Unknown User'
}

const getContactInitial = (contact) => {
  const name = getContactName(contact)
  return name.charAt(0).toUpperCase()
}

// =============== LOCAL STORAGE FUNCTIONS ===============
const loadContactsFromLocalStorage = () => {
  try {
    const storedContacts = localStorage.getItem(STORAGE_KEY)
    if (storedContacts) {
      const parsedContacts = JSON.parse(storedContacts)
      contacts.value = parsedContacts.map(normalizeContact)
      console.log('📱 Loaded WhatsApp contacts from localStorage:', contacts.value.length)
    }
  } catch (error) {
    console.error('❌ Error loading contacts from localStorage:', error)
  }
}

const saveContactsToLocalStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
    console.log('💾 WhatsApp contacts saved to localStorage')
  } catch (error) {
    console.error('❌ Error saving contacts to localStorage:', error)
  }
}

// =============== API FUNCTIONS ===============
const getCompanyPhone = async () => {
  try {
    console.log('🔄 Fetching company phone number...')

    const { data } = await axios.get(`${API_BASE_URL}/whatsapp/status`)

    if (data.success && data.status.phoneNumber) {
      companyPhone.value = data.status.phoneNumber.replace('@c.us', '')
      console.log('✅ Company phone updated:', companyPhone.value)
    }
  } catch (error) {
    console.error('❌ Failed to get company phone from status:', error)

    // Fallback - try to get from WhatsApp sessions
    try {
      console.log('🔄 Trying fallback - fetching from sessions...')

      const sessionData = await axios.get(`${API_BASE_URL}/whatsapp/sessions`)

      if (sessionData.data.success && sessionData.data.sessions.length > 0) {
        const activeSession = sessionData.data.sessions.find(s => s.is_active) || sessionData.data.sessions[0]
        if (activeSession && activeSession.phone_number) {
          companyPhone.value = activeSession.phone_number
          console.log('✅ Company phone from session:', companyPhone.value)
        }
      }
    } catch (sessionError) {
      console.error('❌ Failed to get company phone from sessions:', sessionError)
    }
  }
}

const fetchContacts = async () => {
  isLoading.value = true

  try {
    console.log('🔄 Fetching WhatsApp contacts...')

    const { data } = await axios.get(`${API_BASE_URL}/conversations`, {
      params: { platform: 'whatsapp' }
    })

    if (data.success) {
      contacts.value = data.conversations.map(normalizeContact)
      console.log('✅ Fetched WhatsApp contacts:', contacts.value.length)

      saveContactsToLocalStorage()
    } else {
      console.warn('⚠️ API returned unsuccessful response:', data)
    }
  } catch (error) {
    console.error('❌ Failed to fetch contacts:', error)

    // Keep existing contacts from localStorage on error
    if (contacts.value.length === 0) {
      loadContactsFromLocalStorage()
    }
  } finally {
    isLoading.value = false
  }
}

const saveConversationToDatabase = async (contact) => {
  try {
    console.log('💾 Saving new WhatsApp conversation to database:', contact.whatsappId)

    const response = await axios.post(`${API_BASE_URL}/conversations`, {
      platform: 'whatsapp',
      contact_id: contact.whatsappId,
      contact_name: contact.name,
      whatsapp_id: contact.whatsappId,
      phone_number: contact.phoneNumber
    })

    if (response.data.success) {
      contact.conversationId = response.data.conversation._id
      console.log('✅ Conversation saved to database')
    }
  } catch (error) {
    console.error('❌ Failed to save conversation to database:', error)
  }
}

// =============== HELPER FUNCTIONS ===============
const normalizeContact = (conv) => ({
  whatsappId: conv.whatsapp_id,
  contactNumber: conv.contact_id,
  name: conv.contact_name || conv.contact_id?.replace('@c.us', ''),
  phoneNumber: conv.phone_number || conv.contact_id?.replace('@c.us', ''),
  lastMessage: conv.last_message || 'Tidak ada pesan',
  lastTimestamp: conv.last_message_time || null,
  conversationId: conv._id,
  unreadCount: conv.unread_count || 0
})

const findContactIndex = (contactId) => {
  return contacts.value.findIndex(c =>
    c.whatsappId === contactId || c.contactNumber === contactId
  )
}

const updateExistingContact = (contact, newMessage) => {
  contact.lastMessage = newMessage.text
  contact.lastTimestamp = newMessage.timestamp

  // Increment unread count only if not currently selected
  if (selectedContactId.value !== (contact.whatsappId || contact.contactNumber)) {
    contact.unreadCount = (contact.unreadCount || 0) + 1
  }

  // Move to top of list
  const contactIndex = contacts.value.indexOf(contact)
  if (contactIndex > 0) {
    contacts.value.splice(contactIndex, 1)
    contacts.value.unshift(contact)
  }

  console.log('🔄 Updated existing WhatsApp contact:', contact.whatsappId)
}

const createNewContact = (newMessage) => {
  const newContact = {
    whatsappId: newMessage.sender_id,
    contactNumber: newMessage.sender_id,
    name: newMessage.sender_id.replace('@c.us', ''),
    phoneNumber: newMessage.sender_id.replace('@c.us', ''),
    lastMessage: newMessage.text,
    lastTimestamp: newMessage.timestamp,
    unreadCount: 1
  }

  contacts.value.unshift(newContact)
  console.log('➕ Added new WhatsApp contact:', newContact.whatsappId)

  // Save to database in background
  saveConversationToDatabase(newContact)

  return newContact
}

const selectContact = (contact) => {
  console.log('👆 WhatsApp contact selected:', contact.whatsappId)

  selectedContactId.value = contact.whatsappId || contact.contactNumber

  // Reset unread count when selecting contact
  contact.unreadCount = 0
  saveContactsToLocalStorage()

  emit('select-contact', contact)
}

const showCompanyQR = () => {
  console.log('📱 Showing company QR for phone:', companyPhone.value)

  emit('show-company-qr', {
    phoneNumber: companyPhone.value,
    name: "Ganti Nomor WhatsApp"
  })
}

// =============== WATCHERS ===============
watch(() => props.newMessage, (newMsg) => {
  if (!newMsg || !newMsg.sender_id) {
    console.warn('⚠️ Invalid new WhatsApp message received:', newMsg)
    return
  }

  console.log('👀 New WhatsApp message received:', newMsg)

  const existingContactIndex = findContactIndex(newMsg.sender_id)

  if (existingContactIndex !== -1) {
    // Update existing contact
    const existingContact = contacts.value[existingContactIndex]
    updateExistingContact(existingContact, newMsg)
  } else {
    // Create new contact
    createNewContact(newMsg)
  }

  // Save changes to localStorage
  saveContactsToLocalStorage()
}, { deep: true })

// =============== LIFECYCLE ===============
onMounted(async () => {
  console.log('📱 WhatsappContact mounted')

  // Load from localStorage first for quick UI
  loadContactsFromLocalStorage()

  // Fetch company phone and contacts from API
  await Promise.all([
    getCompanyPhone(),
    fetchContacts()
  ])
})
</script>

<style scoped>
/* =============== SCROLLBAR STYLES =============== */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* =============== HOVER EFFECTS =============== */
.group:hover .text-green-900 {
  color: #14532d;
}

.group:hover .text-green-700 {
  color: #16a34a;
}

/* =============== RESPONSIVE ADJUSTMENTS =============== */
@media (max-width: 640px) {
  .text-xs {
    font-size: 0.7rem;
  }

  .text-sm {
    font-size: 0.8rem;
  }
}
</style>