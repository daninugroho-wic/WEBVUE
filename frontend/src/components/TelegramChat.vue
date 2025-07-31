<template>
    <div class="flex flex-col h-full">
        <!-- Chat Header -->
        <div v-if="props.selectedContact" class="bg-white border-b border-blue-200 p-4">
            <div class="flex items-center space-x-3">
                <div
                    class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ props.selectedContact.name ? props.selectedContact.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-gray-900">
                        {{ props.selectedContact.name || props.selectedContact.username || props.selectedContact.telegramId }}
                    </h3>
                    <p class="text-sm text-blue-500">
                        {{ props.selectedContact.username ? '@' + props.selectedContact.username : props.selectedContact.telegramId }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div v-if="props.selectedContact"
            ref="chatContainer"
            @scroll="handleScroll"
            class="flex-1 overflow-y-auto p-4 space-y-4 bg-blue-50"
        >
            <!-- Loading indicator -->
            <div v-if="loading && messages.length === 0" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>

            <!-- No Messages -->
            <div v-else-if="messages.length === 0" class="flex justify-center py-8">
                <div class="text-center text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-sm">Belum ada pesan</p>
                    <p class="text-xs mt-1">Mulai percakapan dengan mengirim pesan</p>
                </div>
            </div>

            <!-- Messages -->
            <div v-else class="space-y-3">
                <div v-for="message in messages" :key="message._id"
                    :class="[
                        'flex',
                        message.messageSource === 'outgoing' ? 'justify-end' : 'justify-start'
                    ]"
                >
                    <div :class="[
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
                        message.messageSource === 'outgoing'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900'
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

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center bg-white">
            <div class="text-center text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Welcome to Telegram Chat</h3>
                <p class="text-sm">Pilih kontak untuk memulai chat</p>
            </div>
        </div>

        <!-- Message Input -->
        <div v-if="props.selectedContact" class="bg-white border-t border-blue-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-3">
                <input v-model="inputMessage" type="text" placeholder="Ketik pesan..."
                    class="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="loading" />
                <button type="submit" :disabled="!inputMessage.trim() || loading"
                    class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
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

const props = defineProps({
    newMessage: Object,
    selectedContact: Object
})

const emit = defineEmits(['message-sent'])

const messages = ref([])
const inputMessage = ref("")
const chatContainer = ref(null)
const isUserNearBottom = ref(true)
const loading = ref(false)
const sending = ref(false)
const isTyping = ref(false)
const typingTimeout = ref(null)

// Methods
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    })
}

function handleScroll() {
    const container = chatContainer.value
    if (!container) return
    
    const threshold = 100
    const position = container.scrollTop + container.clientHeight
    const height = container.scrollHeight
    isUserNearBottom.value = position + threshold >= height
}

function scrollToBottomIfNeeded() {
    const container = chatContainer.value
    if (container && isUserNearBottom.value) {
        nextTick(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}

function scrollToBottom() {
    const container = chatContainer.value
    if (container) {
        nextTick(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}

function handleTyping() {
    // Clear existing timeout
    if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
    }
    
    // Set typing indicator
    isTyping.value = false // We don't show typing for our own messages
    
    // Clear typing after 3 seconds of inactivity
    typingTimeout.value = setTimeout(() => {
        isTyping.value = false
    }, 3000)
}

function addNewLine() {
    inputMessage.value += '\n'
}

async function loadMessages() {
    if (!props.selectedContact) return
    
    loading.value = true
    try {
        const { data } = await axios.get(`http://localhost:3000/api/telegram/messages`, {
            params: { sender: props.selectedContact.telegramId }
        })
        
        if (data.success) {
            messages.value = data.messages
            await nextTick()
            scrollToBottom()
            console.log('✅ Messages loaded:', messages.value.length)
        }
    } catch (error) {
        console.error('❌ Failed to load messages:', error)
        messages.value = []
    } finally {
        loading.value = false
    }
}

async function refreshMessages() {
    await loadMessages()
}

async function sendMessage() {
    if (!inputMessage.value.trim() || !props.selectedContact || sending.value) return

    const messageText = inputMessage.value.trim()
    const tempMessage = {
        _id: `temp_${Date.now()}`,
        text: messageText,
        sender_id: 'system',
        receiver_id: props.selectedContact.telegramId,
        messageSource: 'outgoing',
        status: 'sending',
        created_at: new Date().toISOString()
    }

    // Add to UI immediately
    messages.value.push(tempMessage)
    inputMessage.value = ""
    await nextTick()
    scrollToBottomIfNeeded()

    sending.value = true
    try {
        const { data } = await axios.post('http://localhost:3000/api/telegram/send', {
            chat_id: props.selectedContact.telegramId,
            message: messageText,
            sender_id: 'system'
        })

        if (data.success) {
            // Update temp message with real data
            const messageIndex = messages.value.findIndex(m => m._id === tempMessage._id)
            if (messageIndex !== -1) {
                messages.value[messageIndex] = {
                    ...tempMessage,
                    _id: data.data.message_id,
                    status: 'sent',
                    telegram_message_id: data.data.telegram_message_id
                }
            }

            // Emit event for parent component
            emit('message-sent', {
                message_id: data.data.message_id,
                text: messageText,
                chat_id: props.selectedContact.telegramId,
                timestamp: new Date().toISOString()
            })

            console.log('✅ Message sent successfully')
        }
    } catch (error) {
        console.error('❌ Failed to send message:', error)
        
        // Update message status to failed
        const messageIndex = messages.value.findIndex(m => m._id === tempMessage._id)
        if (messageIndex !== -1) {
            messages.value[messageIndex].status = 'failed'
        }
    } finally {
        sending.value = false
    }
}

// Watch for new messages
watch(() => props.newMessage, (newMsg) => {
    if (!newMsg || !props.selectedContact) return
    
    // Only add if message is for current contact
    if (newMsg.sender_id === props.selectedContact.telegramId || 
        newMsg.chat_id === props.selectedContact.telegramId) {
        
        // Check if message already exists
        const exists = messages.value.some(m => 
            m.telegram_message_id === newMsg.telegram_message_id ||
            m._id === newMsg.message_id
        )
        
        if (!exists) {
            messages.value.push({
                _id: newMsg.message_id || `msg_${Date.now()}`,
                text: newMsg.text,
                sender_id: newMsg.sender_id,
                receiver_id: 'system',
                messageSource: 'incoming',
                status: 'received',
                created_at: newMsg.timestamp || new Date().toISOString(),
                telegram_message_id: newMsg.telegram_message_id
            })
            
            scrollToBottomIfNeeded()
        }
    }
})

// Watch for contact changes
watch(() => props.selectedContact, async (newContact) => {
    if (newContact) {
        messages.value = []
        await loadMessages()
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    // Auto-refresh messages every 5 seconds for selected contact
    const interval = setInterval(async () => {
        if (props.selectedContact && !loading.value) {
            await loadMessages()
        }
    }, 5000)

    // Cleanup interval on unmount
    return () => {
        clearInterval(interval)
        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value)
        }
    }
})
</script>

<style scoped>
/* Auto resize textarea */
textarea {
    resize: none;
    overflow-y: auto;
}

/* Smooth scrolling */
.overflow-y-auto {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
