<template>
  <div class="h-full w-full bg-green-50 shadow-xl p-3 sm:p-5 flex flex-col">
    <!-- Bagian atas: Judul & Nomor Perusahaan -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-green-900 mb-4 sm:mb-6 border-b border-green-300 pb-2">WHATSAPP</h2>

      <div
        @click="showCompanyQR"
        class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-green-100 border border-green-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-pointer hover:bg-green-200">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 bg-green-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none"
          aria-label="Phone icon">
          📞
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-green-900 tracking-wide select-text text-sm sm:text-base">Nomor Perusahaan</p>
          <p class="text-green-700 text-xs sm:text-sm tracking-wide select-text truncate">{{ companyPhone }}</p>
          <p class="text-green-600 text-xs mt-1">Klik untuk ganti nomor</p>
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

      <div v-else v-for="(contact, index) in contacts" :key="contact.whatsappId || contact.contactNumber || index"
        class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-green-100 cursor-pointer transition-colors"
        :class="{ 'bg-green-100': selectedContactId === (contact.whatsappId || contact.contactNumber) }"
        role="button" tabindex="0" @click="selectContact(contact)" @keydown.enter="selectContact(contact)">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 bg-green-300 rounded-full flex items-center justify-center text-green-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0"
          aria-label="User icon">
          {{ (contact.name || contact.whatsappId || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex flex-col overflow-hidden min-w-0 flex-1">
          <p class="font-semibold text-green-900 truncate select-text text-sm sm:text-base">
            {{ contact.name || contact.whatsappId || contact.contactNumber }}
          </p>
          <p class="text-green-700 text-xs sm:text-sm truncate select-text" :title="contact.lastMessage">
            {{ contact.lastMessage || 'Tidak ada pesan' }}
          </p>
          <p class="text-green-600 text-xs">
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

const companyPhone = ref("+62 838-6647-4123")
const contacts = ref([])

const emit = defineEmits(["select-contact", "show-company-qr"])
const props = defineProps({
  newMessage: Object
})

const selectedContactId = ref(null)

// Function to show company QR code
function showCompanyQR() {
  emit("show-company-qr", {
    phoneNumber: companyPhone.value,
    name: "Ganti Nomor WhatsApp"
  })
}

// Load contacts from API
async function fetchContacts() {
  try {
    console.log('Fetching contacts from API...')
    const { data } = await axios.get("http://localhost:3000/api/contacts")
    
    if (data.success) {
      contacts.value = data.contacts.map(contact => ({
        whatsappId: contact.whatsappId,
        contactNumber: contact.contactNumber || contact.whatsappId,
        name: contact.name || contact.whatsappId?.replace('@c.us', ''),
        phoneNumber: contact.phoneNumber || contact.whatsappId?.replace('@c.us', ''),
        lastMessage: contact.lastMessage || 'Tidak ada pesan',
        lastTimestamp: contact.lastTimestamp || null,
        isBlocked: contact.isBlocked || false
      }))
      
      console.log(`Loaded ${contacts.value.length} contacts`)
      saveContactsToLocalStorage()
    }
  } catch (error) {
    console.error("Gagal mengambil kontak:", error)
    loadContactsFromLocalStorage()
  }
}

// Local storage functions
function loadContactsFromLocalStorage() {
  const storedContacts = localStorage.getItem('whatsapp_contacts')
  if (storedContacts) {
    try {
      contacts.value = JSON.parse(storedContacts)
      console.log('Loaded contacts from localStorage')
    } catch (error) {
      console.error('Error parsing stored contacts:', error)
    }
  }
}

function saveContactsToLocalStorage() {
  localStorage.setItem('whatsapp_contacts', JSON.stringify(contacts.value))
}

// Save new contact to database
async function saveContactToDatabase(contact) {
  try {
    await axios.post("http://localhost:3000/api/contacts", {
      whatsappId: contact.whatsappId,
      name: contact.name,
      phoneNumber: contact.phoneNumber || contact.whatsappId?.replace('@c.us', '')
    })
    console.log('Contact saved to database:', contact.whatsappId)
  } catch (error) {
    console.error("Gagal menyimpan kontak baru ke database:", error)
  }
}

// Get company phone number from WhatsApp status
async function getCompanyPhone() {
  try {
    const { data } = await axios.get("http://localhost:3000/api/whatsapp/status")
    if (data.success && data.status.phoneNumber) {
      companyPhone.value = data.status.phoneNumber.replace('@c.us', '')
    }
  } catch (error) {
    console.error("Gagal mengambil nomor perusahaan:", error)
  }
}

// Watcher untuk pesan baru
watch(() => props.newMessage, (msg) => {
  if (!msg || !msg.sender_id) return

  console.log('Processing new message from:', msg.sender_id)

  const existingIndex = contacts.value.findIndex((c) => 
    c.whatsappId === msg.sender_id || c.contactNumber === msg.sender_id
  )

  if (existingIndex !== -1) {
    const contact = contacts.value[existingIndex]
    contact.lastMessage = msg.text
    contact.lastTimestamp = msg.timestamp
    
    contacts.value.splice(existingIndex, 1)
    contacts.value.unshift(contact)
    
    console.log('Updated existing contact:', contact.name || contact.whatsappId)
  } else {
    const newContact = {
      whatsappId: msg.sender_id,
      contactNumber: msg.sender_id,
      name: msg.sender_id.replace('@c.us', ''),
      phoneNumber: msg.sender_id.replace('@c.us', ''),
      lastMessage: msg.text,
      lastTimestamp: msg.timestamp,
      isBlocked: false
    }
    
    contacts.value.unshift(newContact)
    console.log('Added new contact:', newContact.whatsappId)
    
    saveContactToDatabase(newContact)
  }
  
  saveContactsToLocalStorage()
})

function selectContact(contact) {
  selectedContactId.value = contact.whatsappId || contact.contactNumber
  console.log('Selected contact:', contact)
  emit("select-contact", contact)
}

function formatTime(timestamp) {
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

onMounted(async () => {
  console.log('WhatsappContact mounted')
  
  loadContactsFromLocalStorage()
  await getCompanyPhone()
  await fetchContacts()
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