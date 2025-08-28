<template>
    <div class="h-full w-full bg-blue-50 shadow-xl p-3 sm:p-5 flex flex-col">
        <!-- =============== HEADER SECTION =============== -->
        <div>
            <h2 class="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6 border-b border-blue-300 pb-2">
                TELEGRAM
            </h2>
            
            <!-- Bot Telegram Info -->
            <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 mb-4 sm:mb-6 bg-blue-100 border border-blue-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-default">
                <div class="w-12 h-12 sm:w-14 sm:h-14 bg-blue-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold select-none"
                    aria-label="Bot icon">
                    🤖
                </div>
                <div class="min-w-0 flex-1">
                    <p class="font-semibold text-blue-900 tracking-wide select-text text-sm sm:text-base">
                        Bot Telegram
                    </p>
                    <p class="text-blue-700 text-xs sm:text-sm tracking-wide select-text truncate">
                        {{ botStatus }}
                    </p>
                    <p class="text-blue-600 text-xs mt-1">
                        Status Bot Telegram
                    </p>
                </div>
            </div>
        </div>

        <!-- =============== CONTACTS SECTION =============== -->
        <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-2 sm:gap-3 hide-scrollbar">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>

            <!-- Empty State -->
            <div v-else-if="contacts.length === 0" class="flex items-center justify-center h-32 text-gray-500">
                <div class="text-center">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-sm font-medium">Belum ada kontak</p>
                    <p class="text-xs text-gray-400 mt-1">Kontak akan muncul saat ada pesan masuk</p>
                </div>
            </div>

            <!-- Contacts List -->
            <div v-else class="space-y-2 sm:space-y-3">
                <div 
                    v-for="(contact, index) in filteredContacts" 
                    :key="contact.contact_id || index"
                    class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white rounded-xl shadow hover:bg-blue-100 cursor-pointer transition-colors group relative"
                    :class="{ 'bg-blue-100': selectedContactId === contact.contact_id }"
                    role="button" 
                    tabindex="0" 
                    @click="selectContact(contact)" 
                    @keydown.enter="selectContact(contact)"
                >
                    <!-- Contact Avatar -->
                    <div class="w-12 h-12 sm:w-14 sm:h-14 bg-blue-300 rounded-full flex items-center justify-center text-blue-900 font-semibold text-lg sm:text-xl select-none flex-shrink-0"
                        aria-label="User icon">
                        {{ getContactInitial(contact) }}
                    </div>

                    <!-- Contact Info -->
                    <div class="flex flex-col overflow-hidden min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                            <p class="font-semibold text-blue-900 truncate select-text text-sm sm:text-base">
                                {{ getContactName(contact) }}
                            </p>
                            <p class="text-blue-600 text-xs flex-shrink-0 ml-2">
                                {{ formatTime(contact.last_message_time) }}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-blue-700 text-xs sm:text-sm truncate select-text" 
                                :title="contact.last_message">
                                {{ contact.last_message || 'Tidak ada pesan' }}
                            </p>
                            
                            <!-- Unread Count Badge -->
                            <div v-if="contact.unread_count > 0" 
                                class="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                {{ contact.unread_count > 99 ? '99+' : contact.unread_count }}
                            </div>
                        </div>

                        <!-- Contact ID -->
                        <p class="text-blue-600 text-xs mt-1 truncate">
                            {{ contact.contact_id }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import axios from "axios"

// =============== PROPS & EMITS ===============
const props = defineProps({
    newMessage: Object
})

const emit = defineEmits(['select-contact'])

// =============== REACTIVE STATE ===============
const contacts = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const selectedContactId = ref(null)
const botStatus = ref('Connected')

// =============== CONSTANTS ===============
const STORAGE_KEY = 'telegram_contacts'
const API_BASE_URL = "http://localhost:3000/api/telegram"

// =============== COMPUTED PROPERTIES ===============
const filteredContacts = computed(() => {
    if (!searchQuery.value) return contacts.value
    
    const query = searchQuery.value.toLowerCase()
    return contacts.value.filter(contact => 
        (contact.contact_name && contact.contact_name.toLowerCase().includes(query)) ||
        contact.contact_id.includes(query)
    )
})

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
    } else if (diffInHours < 48) {
        return 'Yesterday'
    } else {
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit'
        })
    }
}

const getContactName = (contact) => {
    return contact.contact_name || contact.contact_id || 'Unknown User'
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
            console.log('📱 Loaded Telegram contacts from localStorage:', contacts.value.length)
        }
    } catch (error) {
        console.error('❌ Error loading contacts from localStorage:', error)
    }
}

const saveContactsToLocalStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
        console.log('💾 Telegram contacts saved to localStorage')
    } catch (error) {
        console.error('❌ Error saving contacts to localStorage:', error)
    }
}

// =============== API FUNCTIONS ===============
const fetchContacts = async () => {
    isLoading.value = true
    
    try {
        console.log('🔄 Fetching Telegram contacts...')
        
        const { data } = await axios.get(`${API_BASE_URL}/contacts`)
        
        if (data.success) {
            contacts.value = data.contacts.map(normalizeContact)
            console.log('✅ Fetched Telegram contacts:', contacts.value.length)
            
            saveContactsToLocalStorage()
        } else {
            console.warn('⚠️ API returned unsuccessful response:', data)
        }
    } catch (error) {
        console.error('❌ Failed to fetch Telegram contacts:', error)
        
        // Keep existing contacts from localStorage on error
        if (contacts.value.length === 0) {
            loadContactsFromLocalStorage()
            
            // Load demo data if completely empty
            if (contacts.value.length === 0) {
                loadDemoContacts()
            }
        }
    } finally {
        isLoading.value = false
    }
}

const markContactAsRead = async (contactId) => {
    const contactIndex = findContactIndex(contactId)
    if (contactIndex === -1 || contacts.value[contactIndex].unread_count === 0) {
        return
    }
    
    const contact = contacts.value[contactIndex]
    contact.unread_count = 0
    saveContactsToLocalStorage()
    
    // Send read status to backend
    if (contact.conversation_id) {
        try {
            await axios.put(`${API_BASE_URL}/read/${contact.conversation_id}`)
            console.log('✅ Marked contact as read:', contactId)
        } catch (error) {
            console.error('❌ Failed to mark as read:', error)
        }
    }
}

const saveContactToDatabase = async (contact) => {
    try {
        console.log('💾 Saving new Telegram contact to database:', contact.contact_id)
        
        await axios.post(`${API_BASE_URL}/contacts`, {
            telegramId: contact.contact_id,
            name: contact.contact_name,
            lastMessage: contact.last_message,
            lastTimestamp: contact.last_message_time,
            conversation_id: contact.conversation_id
        })
        
        console.log('✅ Telegram contact saved to database')
    } catch (error) {
        console.error('❌ Failed to save Telegram contact to database:', error)
    }
}

// =============== HELPER FUNCTIONS ===============
const normalizeContact = (contact) => ({
    conversation_id: contact.conversation_id,
    contact_id: contact.telegramId || contact.contact_id,
    contact_name: contact.name || contact.contact_name,
    last_message: contact.lastMessage || contact.last_message || 'Tidak ada pesan',
    last_message_time: contact.lastTimestamp || contact.last_message_time || null,
    unread_count: contact.unreadCount || contact.unread_count || 0,
    platform: 'telegram'
})

const findContactIndex = (contactId) => {
    return contacts.value.findIndex(c => c.contact_id === contactId)
}

const updateExistingContact = (contact, newMessage) => {
    contact.last_message = newMessage.text
    contact.last_message_time = newMessage.timestamp || new Date().toISOString()
    contact.conversation_id = newMessage.conversation_id
    
    // Increment unread count only if not currently selected
    if (selectedContactId.value !== contact.contact_id) {
        contact.unread_count += 1
    }
    
    // Move to top of list
    const contactIndex = contacts.value.indexOf(contact)
    if (contactIndex > 0) {
        contacts.value.splice(contactIndex, 1)
        contacts.value.unshift(contact)
    }
    
    console.log('🔄 Updated existing Telegram contact:', contact.contact_id)
}

const createNewContact = (newMessage) => {
    const newContact = {
        conversation_id: newMessage.conversation_id,
        contact_id: newMessage.sender_id || newMessage.chat_id,
        contact_name: newMessage.sender_name || newMessage.sender_id,
        last_message: newMessage.text,
        last_message_time: newMessage.timestamp || new Date().toISOString(),
        unread_count: 1,
        platform: 'telegram'
    }
    
    contacts.value.unshift(newContact)
    console.log('➕ Added new Telegram contact:', newContact.contact_id)
    
    // Save to database in background
    saveContactToDatabase(newContact)
    
    return newContact
}

const loadDemoContacts = () => {
    contacts.value = [
        {
            conversation_id: "demo_conv_1",
            contact_id: "123456789",
            contact_name: "Demo User",
            last_message: "Hello from Telegram!",
            last_message_time: new Date().toISOString(),
            unread_count: 1,
            platform: 'telegram'
        }
    ]
    console.log('📋 Loaded demo Telegram contacts')
}

const selectContact = (contact) => {
    console.log('👆 Telegram contact selected:', contact.contact_id)
    
    selectedContactId.value = contact.contact_id
    
    // Mark as read when selecting contact
    markContactAsRead(contact.contact_id)
    
    emit('select-contact', contact)
}

// =============== WATCHERS ===============
watch(() => props.newMessage, (newMsg) => {
    if (!newMsg || !newMsg.sender_id) {
        console.warn('⚠️ Invalid new Telegram message received:', newMsg)
        return
    }
    
    console.log('👀 New Telegram message received:', newMsg)
    
    const existingContactIndex = findContactIndex(newMsg.sender_id || newMsg.chat_id)
    
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
    console.log('📱 TelegramContact mounted')
    
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
.group:hover .text-blue-900 {
    color: #1e3a8a;
}

.group:hover .text-blue-700 {
    color: #3b82f6;
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