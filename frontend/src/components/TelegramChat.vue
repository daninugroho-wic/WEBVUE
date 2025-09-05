<template>
    <div class="flex flex-col h-full">
        <!-- =============== CHAT HEADER =============== -->
        <div v-if="selectedContact" class="bg-white border-b border-blue-200 p-4">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ selectedContact.contact_name ? selectedContact.contact_name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-gray-900">
                        {{ selectedContact.contact_name || selectedContact.contact_id }}
                    </h3>
                    <p class="text-sm text-blue-500">
                        {{ selectedContact.contact_id }}
                    </p>
                </div>
            </div>
        </div>

        <!-- =============== CHAT MESSAGES CONTAINER =============== -->
        <div v-if="selectedContact" ref="chatContainer" @scroll="handleScroll"
            class="flex-1 overflow-y-auto p-4 space-y-4 bg-blue-50">
            <!-- Loading State -->
            <div v-if="loading && messages.length === 0" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
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
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900'
                    ]">
                        <p class="text-sm">{{ message.text }}</p>
                        <div class="flex justify-end mt-1">
                            <span class="text-xs opacity-75">
                                {{ formatTime(message.createdAt || message.created_at || message.timestamp) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- =============== EMPTY STATE - NO CONTACT SELECTED =============== -->
        <div v-else class="flex-1 flex items-center justify-center bg-white">
            <div class="text-center text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Welcome to Telegram Chat</h3>
                <p class="text-sm">Pilih kontak untuk memulai chat</p>
            </div>
        </div>

        <!-- =============== MESSAGE INPUT =============== -->
        <div v-if="selectedContact" class="bg-white border-t border-blue-200">
            <!-- Quick Replies Section - Compact Design -->
            <div class="px-4 border-b border-blue-100">
                <button 
                    @click="toggleQuickReplies" 
                    class="flex items-center justify-between w-full text-left hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
                >
                    <span class="text-sm font-medium text-gray-700">Balasan Cepat</span>
                    <svg 
                        :class="[
                            'w-4 h-4 text-blue-600 transition-transform duration-200',
                            showQuickReplies ? 'rotate-180' : ''
                        ]"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                <!-- Quick Reply Buttons - Collapsible -->
                <div 
                    v-show="showQuickReplies" 
                    class="flex flex-wrap gap-1.5 mt-2 pb-1"
                >
                    <button
                        v-for="(reply, index) in quickReplies"
                        :key="index"
                        @click="useQuickReply(reply.message)"
                        class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
                    >
                        <span class="mr-1">{{ reply.icon }}</span>
                        {{ reply.label }}
                    </button>
                </div>
            </div>

            <!-- Message Input Form -->
            <div class="p-4">
                <form @submit.prevent="sendMessage" class="flex space-x-3">
                    <input 
                        ref="messageInput"
                        v-model="inputMessage" 
                        type="text" 
                        placeholder="Ketik pesan..."
                        class="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        :disabled="loading" 
                        autocomplete="off" 
                        spellcheck="false" 
                    />
                    <button 
                        type="submit" 
                        :disabled="!inputMessage.trim() || loading"
                        class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
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

const emit = defineEmits(['message-sent'])

// =============== REACTIVE STATE ===============
const messages = ref([])
const inputMessage = ref("")
const chatContainer = ref(null)
const messageInput = ref(null)
const isUserNearBottom = ref(true)
const loading = ref(false)
const sending = ref(false)

// Quick replies state
const showQuickReplies = ref(false)
const quickReplies = ref([
    { label: 'Selamat datang', message: 'Selamat datang di layanan customer service kami. Ada yang bisa kami bantu hari ini?', icon: '👋' },
    { label: 'Cek jaringan', message: 'Kami akan mengecek status jaringan di area Anda. Mohon tunggu sebentar ya.', icon: '🔍' },
    { label: 'Reset koneksi', message: 'Silakan coba restart modem/router Anda selama 30 detik, kemudian nyalakan kembali.', icon: '🔄' },
    { label: 'Tim teknis', message: 'Tim teknisi kami akan dikirim ke lokasi Anda dalam 2-4 jam kerja.', icon: '🔧' },
    { label: 'Cek tagihan', message: 'Untuk mengecek tagihan, silakan kirimkan nomor pelanggan atau ID layanan Anda.', icon: '💳' },
    { label: 'Info paket', message: 'Berikut informasi detail paket internet Anda. Ada yang ingin ditanyakan?', icon: '📋' },
    { label: 'Pembayaran', message: 'Pembayaran dapat dilakukan melalui ATM, mobile banking, atau datang langsung ke kantor kami.', icon: '💰' },
    { label: 'Terima kasih', message: 'Terima kasih telah menghubungi kami. Jika ada kendala lain, jangan ragu untuk menghubungi kembali.', icon: '🙏' }
])

// =============== CONSTANTS ===============
const currentUserId = "system"

// =============== UTILITY FUNCTIONS ===============
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// =============== SCROLL FUNCTIONS ===============
const handleScroll = () => {
    const container = chatContainer.value
    if (!container) return

    const threshold = 100
    const position = container.scrollTop + container.clientHeight
    const height = container.scrollHeight
    isUserNearBottom.value = position + threshold >= height
}

const scrollToBottomIfNeeded = () => {
    const container = chatContainer.value
    if (container && isUserNearBottom.value) {
        nextTick(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}

const scrollToBottom = () => {
    const container = chatContainer.value
    if (container) {
        nextTick(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}

// =============== API FUNCTIONS ===============
const loadMessages = async () => {
    if (!props.selectedContact) return

    loading.value = true

    try {
        console.log('🔄 Loading Telegram messages for:', props.selectedContact.contact_id)

        const { data } = await axios.get(`http://localhost:3000/api/telegram/messages`, {
            params: { sender: props.selectedContact.contact_id }
        })

        if (data.success) {
            messages.value = data.messages.map(normalizeMessage)
            console.log(`✅ Loaded ${messages.value.length} messages`)

            await nextTick()
            scrollToBottom()
        }
    } catch (error) {
        console.error('❌ Failed to load messages:', error)
        // Keep existing messages on error to maintain UI state
    } finally {
        loading.value = false
    }
}

const sendMessage = async () => {
    // Validation
    if (!inputMessage.value.trim() || !props.selectedContact || sending.value) {
        return
    }

    const messageText = inputMessage.value.trim()

    // Create temporary message for optimistic UI update
    const tempMessage = createTempMessage(messageText)

    // Add message to UI immediately
    messages.value.push(tempMessage)
    inputMessage.value = ""

    await nextTick()
    scrollToBottomIfNeeded()

    sending.value = true

    try {
        console.log('📤 Sending Telegram message:', messageText)

        const requestData = {
            chat_id: props.selectedContact.contact_id,
            message: messageText,
            sender_id: currentUserId
        }

        const { data } = await axios.post('http://localhost:3000/api/telegram/send', requestData)

        if (data.success) {
            // Update temp message with real data from backend
            updateTempMessage(tempMessage._id, data.data.message_id)

            // Emit event for parent component
            emit('message-sent', {
                message_id: data.data.message_id,
                text: messageText,
                chat_id: props.selectedContact.contact_id,
                timestamp: new Date().toISOString()
            })

            console.log('✅ Telegram message sent successfully')
        } else {
            throw new Error(data.error || 'Failed to send message')
        }
    } catch (error) {
        console.error('❌ Failed to send message:', error)

        // Update status to failed, keep bubble visible
        markMessageAsFailed(tempMessage._id)

        // Show error to user
        alert('Gagal mengirim pesan Telegram: ' + (error.response?.data?.error || error.message))
    } finally {
        sending.value = false
    }
}

// =============== QUICK REPLY FUNCTIONS ===============
const toggleQuickReplies = () => {
    showQuickReplies.value = !showQuickReplies.value
}

const useQuickReply = (message) => {
    inputMessage.value = message
    
    // Focus pada input setelah memilih quick reply
    nextTick(() => {
        if (messageInput.value) {
            messageInput.value.focus()
        }
    })
}

// =============== HELPER FUNCTIONS ===============
const normalizeMessage = (msg) => ({
    _id: msg._id,
    text: msg.text,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    status: msg.status,
    createdAt: msg.createdAt || msg.created_at || msg.timestamp,
    created_at: msg.created_at || msg.createdAt || msg.timestamp,
    timestamp: msg.timestamp || msg.created_at || msg.createdAt,
    platform: msg.platform
})
const createTempMessage = (text) => ({
    _id: `temp_${Date.now()}`,
    text,
    sender_id: currentUserId,
    receiver_id: props.selectedContact.contact_id,
    status: 'sent',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    platform: 'telegram',
    isTemp: true
})

const isMessageFromCurrentUser = (message) => {
    return message.sender_id === currentUserId ||
        message.status === 'sent' ||
        message.send_by === 'system'
}

const updateTempMessage = (tempId, realId) => {
    const messageIndex = messages.value.findIndex(m => m._id === tempId)
    if (messageIndex !== -1) {
        messages.value[messageIndex] = {
            ...messages.value[messageIndex],
            _id: realId,
            status: 'sent',
            isTemp: false
        }
    }
}

const markMessageAsFailed = (messageId) => {
    const messageIndex = messages.value.findIndex(m => m._id === messageId)
    if (messageIndex !== -1) {
        messages.value[messageIndex].status = 'failed'
    }
}

const isMessageForCurrentContact = (newMsg) => {
    return props.selectedContact && (
        newMsg.sender_id === props.selectedContact.contact_id ||
        newMsg.conversation_id === props.selectedContact.conversation_id
    )
}

const isMessageDuplicate = (messageId) => {
    return messages.value.some(m => m._id === messageId)
}

// =============== WATCHERS ===============
watch(() => props.newMessage, (newMsg) => {
    if (!newMsg) return

    console.log('👀 New Telegram message received:', newMsg)

    // Only add if message is for current active contact
    if (isMessageForCurrentContact(newMsg)) {
        // Check for duplicates
        if (!isMessageDuplicate(newMsg.message_id)) {
            console.log('➕ Adding new message to chat')

            messages.value.push({
                _id: newMsg.message_id || `msg_${Date.now()}`,
                text: newMsg.text,
                sender_id: newMsg.sender_id,
                receiver_id: currentUserId,
                status: 'received',
                createdAt: newMsg.timestamp || newMsg.created_at || new Date().toISOString(),
                created_at: newMsg.created_at || newMsg.timestamp || new Date().toISOString(),
                timestamp: newMsg.timestamp || newMsg.created_at || new Date().toISOString(),
                platform: 'telegram'
            })

            scrollToBottomIfNeeded()
        }
    }
})

watch(() => props.selectedContact, async (newContact) => {
    if (newContact) {
        console.log('🔄 Contact changed, loading messages for:', newContact.contact_id)
        await loadMessages()
    } else {
        messages.value = []
    }
}, { immediate: true })

// =============== LIFECYCLE ===============
onMounted(() => {
    console.log('📱 TelegramChat mounted')

    // Auto-refresh messages every 30 seconds
    const interval = setInterval(async () => {
        if (props.selectedContact && !loading.value) {
            console.log('🔄 Auto-refreshing messages...')
            await loadMessages()
        }
    }, 30000)

    // Cleanup interval on unmount
    return () => {
        console.log('📱 TelegramChat unmounted, clearing interval')
        clearInterval(interval)
    }
})
</script>

<style scoped>
/* =============== SCROLLBAR STYLES =============== */
.overflow-y-auto {
    scroll-behavior: smooth;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #2563eb;
}

/* =============== INPUT STYLES =============== */
textarea {
    resize: none;
    overflow-y: auto;
}
</style>