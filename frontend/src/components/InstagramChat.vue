<template>
    <div class="flex flex-col h-full">
        <!-- Chat Header -->
        <div v-if="selectedContact" class="bg-white border-b border-pink-200 p-4">
            <div class="flex items-center space-x-3">
                <div
                    class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-medium">
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
                <div v-for="message in messages" :key="message.message_id" :class="[ 
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
                                {{ formatTime(message.timestamp || message.created_at) }}
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

// Watcher untuk pesan baru
watch(() => props.newMessage, async (val) => {
    if (val && val.message_id && props.selectedContact && val.sender_id === props.selectedContact.contactNumber) {
        if (!messages.value.find((m) => m.message_id === val.message_id)) {
            messages.value.push({
                message_id: val.message_id,
                sender_id: val.sender_id,
                text: val.text,
                status: val.status || 'received',
                timestamp: val.timestamp || new Date()
            })
            await nextTick()
            scrollToBottomIfNeeded()
        }
    }
})

// Watcher untuk kontak yang dipilih
watch(() => props.selectedContact, async (newContact) => {
    if (!newContact || !newContact.contactNumber) {
        messages.value = []
        return
    }
    try {
        const { data } = await axios.get(`http://localhost:3000/api/instagram/messages?sender=${newContact.contactNumber}`)
        if (data.success) {
            messages.value = data.messages.map((msg) => ({
                message_id: msg._id,
                sender_id: String(msg.sender_id),
                text: msg.text,
                created_at: msg.created_at
            }))
            await nextTick()
            scrollToBottom()
        }
    } catch (error) {
        console.error("Gagal mengambil pesan:", error)
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
    if (!inputMessage.value.trim()) return

    const tempMessage = {
        message_id: `temp_${Date.now()}`,
        sender_id: currentUserId,
        text: inputMessage.value,
        status: "pending",
        timestamp: new Date().toISOString()
    }

    messages.value.push(tempMessage)
    inputMessage.value = ""
    await nextTick()
    scrollToBottomIfNeeded()

    try {
        const userToSend = props.selectedContact ? props.selectedContact.contactNumber : "defaultReceiver"
        const { data } = await axios.post("http://localhost:3000/instagram/send-message", {
            username: userToSend,
            message: tempMessage.text,
            sender_id: currentUserId
        })

        if (data.success) {
            tempMessage.status = "sent"
            setTimeout(() => {
                tempMessage.status = "delivered"
                setTimeout(() => {
                    tempMessage.status = "read"
                }, 2000)
            }, 1000)
        }
    } catch (error) {
        console.error("Gagal mengirim pesan:", error)
        tempMessage.status = "failed"
    }
}

onMounted(() => {
    // Polling untuk pesan baru setiap 3 detik
    setInterval(async () => {
        try {
            const { data } = await axios.get("http://localhost:3000/instagram/receive-message")
            if (data.success) {
                const existingIds = new Set(messages.value.map((m) => m.message_id))
                data.messages.forEach((message) => {
                    if (!existingIds.has(message._id)) {
                        messages.value.push({
                            message_id: message._id,
                            sender_id: String(message.sender_id),
                            text: message.text,
                            created_at: message.created_at
                        })
                    }
                })
            }
        } catch (error) {
            console.error("Gagal mengambil pesan masuk:", error)
        }
    }, 3000)
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
</style>