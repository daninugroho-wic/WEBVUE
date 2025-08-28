<template>
    <div class="h-full w-full bg-pink-50 shadow-xl p-3 sm:p-5 flex flex-col">
        <!-- =============== HEADER SECTION =============== -->
        <div>
            <h2 class="text-xl sm:text-2xl font-bold text-pink-900 mb-4 sm:mb-6 border-b border-pink-300 pb-2">
                INSTAGRAM
            </h2>
            
            <!-- Company Instagram Info -->
            <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-pink-100 border border-pink-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-default">
                <div class="w-12 h-12 sm:w-14 sm:h-14 bg-pink-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none"
                    aria-label="Instagram icon">
                    📷
                </div>
                <div class="min-w-0 flex-1">
                    <p class="font-semibold text-pink-900 tracking-wide select-text text-sm sm:text-base">
                        Instagram Perusahaan
                    </p>
                    <p class="text-pink-700 text-xs sm:text-sm tracking-wide select-text truncate">
                        {{ companyInstagram }}
                    </p>
                    <p class="text-pink-600 text-xs mt-1">
                        Akun resmi perusahaan
                    </p>
                </div>
            </div>
        </div>

        <!-- =============== CONTACTS SECTION =============== -->
        <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-2 sm:gap-3 hide-scrollbar">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
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
                <div 
                    v-for="(contact, index) in contacts" 
                    :key="contact.contact_id || index"
                    class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-pink-100 cursor-pointer transition-colors group"
                    role="button" 
                    tabindex="0" 
                    @click="selectContact(contact)" 
                    @keydown.enter="selectContact(contact)"
                >
                    <!-- Contact Avatar -->
                    <div class="w-12 h-12 sm:w-14 sm:h-14 bg-pink-300 rounded-full flex items-center justify-center text-pink-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0"
                        aria-label="User icon">
                        {{ getContactInitial(contact) }}
                    </div>

                    <!-- Contact Info -->
                    <div class="flex flex-col overflow-hidden min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                            <p class="font-semibold text-pink-900 truncate select-text text-sm sm:text-base">
                                {{ getContactName(contact) }}
                            </p>
                            <p class="text-pink-600 text-xs flex-shrink-0 ml-2">
                                {{ formatTime(contact.lastTimestamp) }}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-pink-700 text-xs sm:text-sm truncate select-text" 
                                :title="contact.lastMessage">
                                {{ contact.lastMessage || 'Tidak ada pesan' }}
                            </p>
                            
                            <!-- Unread Count Badge -->
                            <div v-if="contact.unreadCount > 0" 
                                class="bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                {{ contact.unreadCount > 99 ? '99+' : contact.unreadCount }}
                            </div>
                        </div>

                        <!-- Contact ID -->
                        <p class="text-pink-600 text-xs mt-1 truncate">
                            {{ contact.contact_id }}
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

const emit = defineEmits(['select-contact'])

// =============== REACTIVE STATE ===============
const contacts = ref([])
const companyInstagram = ref("@perusahaan_official")
const isLoading = ref(false)

// =============== CONSTANTS ===============
const STORAGE_KEY = 'instagram_contacts'
const API_BASE_URL = "http://localhost:3000/api/instagram"

// =============== UTILITY FUNCTIONS ===============
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    // Show time for today, date for older messages
    if (diffInHours < 24) {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } else {
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit'
        })
    }
}

const getContactName = (contact) => {
    return contact.name || contact.contact_id || 'Unknown User'
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
            console.log('📱 Loaded contacts from localStorage:', contacts.value.length)
        }
    } catch (error) {
        console.error('❌ Error loading contacts from localStorage:', error)
    }
}

const saveContactsToLocalStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
        console.log('💾 Contacts saved to localStorage')
    } catch (error) {
        console.error('❌ Error saving contacts to localStorage:', error)
    }
}

// =============== API FUNCTIONS ===============
const fetchContacts = async () => {
    isLoading.value = true
    
    try {
        console.log('🔄 Fetching Instagram contacts...')
        
        const { data } = await axios.get(`${API_BASE_URL}/contacts`)
        
        if (data.success) {
            contacts.value = data.contacts.map(normalizeContact)
            console.log('✅ Fetched contacts:', contacts.value.length)
            
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

const saveContactToDatabase = async (contact) => {
    try {
        console.log('💾 Saving new contact to database:', contact.contact_id)
        
        await axios.post(`${API_BASE_URL}/contacts`, {
            contact_id: contact.contact_id,
            name: contact.name,
            last_message: contact.lastMessage,
            last_message_time: contact.lastTimestamp,
            conversation_id: contact.conversation_id
        })
        
        console.log('✅ Contact saved to database')
    } catch (error) {
        console.error('❌ Failed to save contact to database:', error)
    }
}

// =============== HELPER FUNCTIONS ===============
const normalizeContact = (contact) => ({
    conversation_id: contact.conversation_id,
    contact_id: contact.contact_id,
    name: contact.name || contact.contact_id,
    lastMessage: contact.lastMessage || contact.last_message || 'Tidak ada pesan',
    lastTimestamp: contact.lastTimestamp || contact.last_message_time || null,
    unreadCount: contact.unreadCount || contact.unread_count || 0
})

const findContactIndex = (contactId) => {
    return contacts.value.findIndex(c => c.contact_id === contactId)
}

const updateExistingContact = (contact, newMessage) => {
    contact.lastMessage = newMessage.text
    contact.lastTimestamp = newMessage.timestamp
    contact.conversation_id = newMessage.conversation_id
    
    // Move to top of list
    const contactIndex = contacts.value.indexOf(contact)
    if (contactIndex > 0) {
        contacts.value.splice(contactIndex, 1)
        contacts.value.unshift(contact)
    }
    
    console.log('🔄 Updated existing contact:', contact.contact_id)
}

const createNewContact = (newMessage) => {
    const newContact = {
        conversation_id: newMessage.conversation_id,
        contact_id: newMessage.sender_id,
        name: newMessage.sender_name || newMessage.sender_id,
        lastMessage: newMessage.text,
        lastTimestamp: newMessage.timestamp,
        unreadCount: 1
    }
    
    contacts.value.unshift(newContact)
    console.log('➕ Added new contact:', newContact.contact_id)
    
    // Save to database in background
    saveContactToDatabase(newContact)
    
    return newContact
}

const selectContact = (contact) => {
    console.log('👆 Contact selected:', contact.contact_id)
    
    // Reset unread count
    contact.unreadCount = 0
    saveContactsToLocalStorage()
    
    emit('select-contact', contact)
}

// =============== WATCHERS ===============
watch(() => props.newMessage, (newMsg) => {
    if (!newMsg || !newMsg.sender_id) {
        console.warn('⚠️ Invalid new message received:', newMsg)
        return
    }
    
    console.log('👀 New Instagram message received:', newMsg)
    
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
    console.log('📱 InstagramContact mounted')
    
    // Load from localStorage first for quick UI
    loadContactsFromLocalStorage()
    
    // Then fetch fresh data from API
    await fetchContacts()
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
.group:hover .text-pink-900 {
    color: #be185d;
}

.group:hover .text-pink-700 {
    color: #ec4899;
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