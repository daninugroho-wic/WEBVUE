<template>
    <div class="flex flex-col h-full">
        <!-- Chat Header -->
        <div v-if="selectedContact" class="bg-white border-b border-pink-200 p-4">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-pink-900">
                        {{ selectedContact.name || selectedContact.contactNumber || selectedContact.instagramId }}
                    </h3>
                    <p class="text-sm text-pink-500">
                        {{ selectedContact.instagramId || selectedContact.contactNumber }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div ref="chatContainer" @scroll="handleScroll" class="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50">
            <!-- Empty state -->
            <div v-if="!selectedContact" class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-lg font-medium">Pilih kontak untuk memulai chat</p>
                </div>
            </div>

            <!-- Messages -->
            <div v-else class="space-y-3">
                <div v-for="message in messages" :key="message._id" :class="[
                    'flex',
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                ]">
                    <div :class="[
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
                        message.sender_id === currentUserId
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

        <!-- Message Input -->
        <div v-if="selectedContact" class="bg-white border-t border-pink-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-3">
                <input v-model="inputMessage" type="text" placeholder="Ketik pesan..."
                    class="flex-1 border border-pink-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    :disabled="isLoading" />
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

const props = defineProps({
    newMessage: Object,
    selectedContact: Object
})

const messages = ref([])
const inputMessage = ref("")
const currentUserId = "user_3"
const chatContainer = ref(null)
const isUserNearBottom = ref(true)
const isLoading = ref(false)

// Watcher untuk pesan baru
watch(() => props.newMessage, async (val) => {
    if (
        val &&
        val.message_id &&
        props.selectedContact &&
        val.sender_id === props.selectedContact.conversation_id
    ) {
        if (!messages.value.find((m) => m._id === val.message_id)) {
            messages.value.push({
                _id: val.message_id,
                sender_id: val.sender_id,
                receiver_id: val.receiver_id,
                text: val.text,
                created_at: val.timestamp || new Date().toISOString()
            })
            await nextTick()
            scrollToBottomIfNeeded()
        }
    }
})

// Watcher untuk kontak yang dipilih
watch(() => props.selectedContact, async (newContact) => {
    if (!newContact || !newContact.conversation_id) {
        messages.value = []
        return
    }
    try {
        isLoading.value = true
        const { data } = await axios.get(`http://localhost:3000/api/instagram/messages?conversation_id=${newContact.conversation_id}`)
        if (data.success) {
            messages.value = data.messages.map((msg) => ({
                _id: msg._id,
                sender_id: String(msg.sender_id),
                receiver_id: String(msg.receiver_id),
                text: msg.text,
                created_at: msg.created_at
            }))
            await nextTick()
            scrollToBottom()
        }
    } catch (error) {
        console.error("Gagal mengambil pesan:", error)
    } finally {
        isLoading.value = false
    }
}, { immediate: true })

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
        container.scrollTop = container.scrollHeight
    }
}

const scrollToBottom = () => {
    const container = chatContainer.value
    if (container) {
        container.scrollTop = container.scrollHeight
    }
}

const sendMessage = async () => {
    if (!inputMessage.value.trim() || !props.selectedContact) return

    const tempMessage = {
        _id: `temp_${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: props.selectedContact.contact_id,
        text: inputMessage.value,
        created_at: new Date().toISOString()
    }

    messages.value.push(tempMessage)
    inputMessage.value = ""
    await nextTick()
    scrollToBottomIfNeeded()

    try {
        console.log({
            user_id: props.selectedContact?.contact_id,
            message: inputMessage.value,
            sender_id: currentUserId
        });
        await axios.post("http://localhost:3000/api/instagram/send", {
            user_id: props.selectedContact.contact_id,
            message: inputMessage.value,                   
            sender_id: currentUserId                         
        })
    } catch (error) {
        console.error("Gagal mengirim pesan:", error)
    }
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(() => {
})
</script>

<style scoped>
.hide-scrollbar-horizontal::-webkit-scrollbar {
    display: none;
}

.hide-scrollbar-horizontal {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

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
    background: #ef4444;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>