<template>
    <div class="flex flex-col h-full">
        <!-- =============== CHAT HEADER =============== -->
        <div v-if="selectedContact" class="bg-white border-b border-pink-200 p-4">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-gray-900">
                        {{ selectedContact.name || selectedContact.contact_id }}
                    </h3>
                    <p class="text-sm text-pink-500">
                        {{ selectedContact.contact_id }}
                    </p>
                </div>
            </div>
        </div>

        <!-- =============== CHAT MESSAGES CONTAINER =============== -->
        <div ref="chatContainer" @scroll="handleScroll" class="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50">
            <!-- Loading State -->
            <div v-if="isLoading && messages.length === 0" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            </div>

            <!-- Empty State - No Contact Selected -->
            <div v-else-if="!selectedContact" class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 class="text-lg font-medium mb-2">Welcome to Instagram Chat</h3>
                    <p class="text-sm">Pilih kontak untuk memulai chat</p>
                    <p class="text-xs text-gray-400 mt-2">Instagram Direct Message</p>
                </div>
            </div>

            <!-- Empty Messages State -->
            <div v-else-if="messages.length === 0" class="flex justify-center py-8">
                <div class="text-center text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-sm">Belum ada pesan</p>
                    <p class="text-xs mt-1">Mulai percakapan dengan mengirim pesan</p>
                </div>
            </div>

            <!-- Messages List -->
            <div v-else class="space-y-3">
                <div v-for="message in messages" :key="message._id" :class="[
                    'flex',
                    isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'
                ]">
                    <div :class="[
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
                        isMessageFromCurrentUser(message)
                            ? 'bg-pink-500 text-white'
                            : 'bg-white text-pink-900'
                    ]">
                        <p class="text-sm">{{ message.text }}</p>
                        <div class="flex justify-end mt-1">
                            <span class="text-xs opacity-75">
                                {{ formatTime(message.created_at) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- =============== MESSAGE INPUT =============== -->
        <div v-if="selectedContact" class="bg-white border-t border-pink-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-3">
                <input v-model="inputMessage" type="text" placeholder="Ketik pesan..."
                    class="flex-1 border border-pink-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    :disabled="isLoading" autocomplete="off" spellcheck="false" />
                <button type="submit" :disabled="!inputMessage.trim() || isLoading"
                    class="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import axios from "axios"
import { ref, onMounted, nextTick, watch } from "vue"

// =============== PROPS & EMITS ===============
const props = defineProps({
    newMessage: Object,
    selectedContact: Object
})

// =============== REACTIVE STATE ===============
const messages = ref([])
const inputMessage = ref("")
const chatContainer = ref(null)
const isUserNearBottom = ref(true)
const isLoading = ref(false)

// =============== CONSTANTS ===============
const currentUserId = "user_3"
const currentInstagramId = ref(null)

// =============== UTILITY FUNCTIONS ===============
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// =============== SCROLL FUNCTIONS ===============
let scrollTimeout

const handleScroll = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout)

    scrollTimeout = setTimeout(() => {
        const container = chatContainer.value
        if (!container) return

        const threshold = 50
        const position = container.scrollTop + container.clientHeight
        const height = container.scrollHeight
        isUserNearBottom.value = position + threshold >= height
    }, 50)
}

const scrollToBottom = () => {
    if (chatContainer.value) {
        setTimeout(() => {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }, 10)
    }
}

const forceScrollToBottom = () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
            isUserNearBottom.value = true
        }
    })
}

// =============== API FUNCTIONS ===============
const getInstagramStatus = async () => {
    try {
        const { data } = await axios.get("http://localhost:3000/api/instagram/status")

        if (data.success && data.status.username) {
            currentInstagramId.value = data.status.username
            console.log('✅ Current Instagram user:', currentInstagramId.value)
        }
    } catch (error) {
        console.error('❌ Failed to get Instagram status:', error)
    }
}

const loadMessages = async (contact) => {
    if (!contact || !contact.conversation_id) {
        console.warn('⚠️ conversation_id tidak tersedia untuk kontak:', contact)
        messages.value = []
        return
    }

    isLoading.value = true

    try {
        console.log('🔄 Loading messages for conversation_id:', contact.conversation_id)

        const { data } = await axios.get(`http://localhost:3000/api/instagram/messages`, {
            params: { conversation_id: contact.conversation_id }
        })

        if (data.success) {
            messages.value = data.messages.map(normalizeMessage)
            console.log(`✅ Loaded ${messages.value.length} messages`)

            await nextTick()
            forceScrollToBottom()
        }
    } catch (error) {
        console.error('❌ Failed to load messages:', error)

        if (error.response?.status === 400) {
            console.warn('⚠️ Invalid conversation_id, creating new conversation...')
            messages.value = []
        }
    } finally {
        isLoading.value = false
    }
}

const sendMessage = async () => {
    // Validation
    if (!inputMessage.value.trim() || !props.selectedContact) {
        return
    }

    const messageText = inputMessage.value.trim()

    // Create temporary message for optimistic UI update
    const tempMessage = createTempMessage(messageText)

    // Add message to UI immediately
    messages.value.push(tempMessage)
    inputMessage.value = ""
    forceScrollToBottom()

    try {
        console.log('📤 Sending Instagram message:', messageText)

        const requestData = {
            user_id: props.selectedContact.contact_id,
            message: messageText,
            sender_id: currentUserId
        }

        const { data } = await axios.post("http://localhost:3000/api/instagram/send", requestData)

        if (data.success) {
            // Update temp message with real data
            updateTempMessage(tempMessage._id, data.message_id)
            console.log('✅ Instagram message sent successfully')
        } else {
            throw new Error(data.error || 'Gagal mengirim pesan')
        }

    } catch (error) {
        console.error('❌ Failed to send message:', error)

        // Remove failed temp message
        removeTempMessage(tempMessage._id)

        // Show error message
        const errorMessage = getErrorMessage(error)
        alert(errorMessage)

        // Restore input text
        inputMessage.value = messageText
    }
}

// =============== HELPER FUNCTIONS ===============
const normalizeMessage = (msg) => ({
    _id: msg._id,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    text: msg.text,
    created_at: msg.created_at,
    status: msg.status,
    platform: msg.platform
})

const createTempMessage = (text) => ({
    _id: `temp_${Date.now()}`,
    sender_id: currentUserId,
    receiver_id: props.selectedContact.contact_id,
    text,
    created_at: new Date().toISOString(),
    status: 'sending',
    platform: 'instagram',
    isTemp: true
})

const updateTempMessage = (tempId, realId) => {
    const tempIndex = messages.value.findIndex(msg => msg._id === tempId)
    if (tempIndex !== -1) {
        messages.value[tempIndex] = {
            ...messages.value[tempIndex],
            _id: realId || tempId,
            status: 'sent',
            isTemp: false
        }
    }
}

const removeTempMessage = (tempId) => {
    const tempIndex = messages.value.findIndex(msg => msg._id === tempId)
    if (tempIndex !== -1) {
        messages.value.splice(tempIndex, 1)
    }
}

const getErrorMessage = (error) => {
    if (error.response?.data?.error) {
        return error.response.data.error
    } else if (error.response?.status === 503) {
        return 'Instagram belum siap, silakan login terlebih dahulu'
    } else if (error.response?.status === 500) {
        return 'Server error, silakan coba lagi'
    }
    return 'Gagal mengirim pesan'
}

const isMessageFromCurrentUser = (message) => {
    return message.sender_id === currentUserId ||
        message.sender_id === currentInstagramId.value ||
        message.send_by === 'system'
}

const isMessageForCurrentContact = (newMsg) => {
    return props.selectedContact &&
        (newMsg.sender_id === props.selectedContact.contact_id ||
            newMsg.receiver_id === props.selectedContact.contact_id)
}


// =============== WATCHERS ===============
watch(() => props.newMessage, async (newMsg) => {
    if (!newMsg || !newMsg.message_id) return

    console.log('👀 New Instagram message received:', newMsg)

    // Only add if message is for current active contact
    if (isMessageForCurrentContact(newMsg)) {

        messages.value.push({
            _id: newMsg.message_id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            text: newMsg.text,
            created_at: newMsg.timestamp || new Date().toISOString(),
            status: 'received'
        })

        forceScrollToBottom()
    }
})

watch(() => props.selectedContact, async (newContact) => {
    if (!newContact) {
        messages.value = []
        return
    }

    console.log('🔄 Contact changed, loading messages for:', newContact.contact_id)
    await loadMessages(newContact)
}, { immediate: true })

// =============== LIFECYCLE ===============
onMounted(async () => {
    console.log('📱 InstagramChat mounted')
    await getInstagramStatus()
})
</script>

<style scoped>
/* =============== SCROLLBAR STYLES =============== */
.overflow-y-auto {
    scroll-behavior: smooth;
    scrollbar-width: thin;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #ec4899;
    border-radius: 3px;
    transition: background-color 0.2s;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #be185d;
}
</style>