<template>
    <div class="flex flex-col h-full">
        <!-- Chat Header -->
        <div v-if="selectedContact" class="bg-white border-b border-gray-200 p-4">
            <div class="flex items-center space-x-3">
                <div
                    class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-gray-900">
                        {{ selectedContact.name || selectedContact.contactNumber || selectedContact.whatsappId }}
                    </h3>
                    <p class="text-sm text-gray-500">
                        {{ selectedContact.phoneNumber || selectedContact.contactNumber || selectedContact.whatsappId }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div ref="chatContainer" @scroll="handleScroll" class="flex-1 overflow-y-auto p-4 space-y-4 bg-green-50">
            <!-- Loading indicator -->
            <div v-if="isLoading" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>

            <!-- QR Code Display -->
            <div v-else-if="showQRCode" class="flex items-center justify-center h-full">
                <div class="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-green-900 mb-2">{{ qrData.name }}</h3>
                        <p class="text-green-700 font-medium">{{ qrData.phoneNumber }}</p>
                    </div>

                    <!-- QR Code -->
                    <div class="bg-white p-4 rounded-xl border-2 border-green-200 mb-4 mx-auto inline-block">
                        <canvas ref="qrCanvas" class="mx-auto"></canvas>
                    </div>

                    <p class="text-sm text-gray-600 mb-4">
                        Scan QR Code ini untuk mengganti nomor WhatsApp
                    </p>

                    <button @click="hideQRCode"
                        class="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        ✕ Tutup
                    </button>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else-if="!selectedContact" class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-lg font-medium">Pilih kontak untuk memulai chat</p>
                    <p class="text-sm text-gray-400 mt-2">atau klik nomor perusahaan untuk ganti nomor</p>
                </div>
            </div>

            <!-- Messages -->
            <div v-else class="space-y-3">
                <div v-for="message in messages" :key="message.message_id" :class="[
                    'flex',
                    isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'
                ]">
                    <div :class="[
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
                        isMessageFromCurrentUser(message)
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900'
                    ]">
                        <p class="text-sm">{{ message.text }}</p>
                        <div class="flex justify-end mt-1">
                            <span class="text-xs opacity-75">
                                {{ formatTime(message.created_at || message.timestamp) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Input -->
        <div v-if="selectedContact && !showQRCode" class="bg-white border-t border-gray-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-3">
                <input v-model="inputMessage" type="text" placeholder="Ketik pesan..."
                    class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    :disabled="isLoading" />
                <button type="submit" :disabled="!inputMessage.trim() || isLoading"
                    class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
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
import QRCode from 'qrcode'

const props = defineProps({
    newMessage: Object,
    selectedContact: Object,
    showCompanyQR: Object
})

const messages = ref([])
const inputMessage = ref("")
const currentUserId = "user_3"
const chatContainer = ref(null)
const isUserNearBottom = ref(true)
const isLoading = ref(false)

// QR Code related
const showQRCode = ref(false)
const qrData = ref({})
const qrCanvas = ref(null)

// Get current WhatsApp client info
const currentWhatsAppId = ref(null)

// Function to determine if message is from current user
const isMessageFromCurrentUser = (message) => {
    return message.sender_id === currentWhatsAppId.value || message.send_by === 'system'
}

// Generate QR Code untuk ganti nomor WhatsApp
async function generateQRCode(phoneNumber) {
    try {
        const canvas = qrCanvas.value
        if (!canvas) return

        // Clean phone number dan buat format untuk QR code switching
        const cleanNumber = phoneNumber.replace(/\D/g, '')

        // QR Code berisi nomor telepon saja untuk switching account
        const qrContent = `whatsapp://switch?phone=${cleanNumber}`

        // Generate QR code
        await QRCode.toCanvas(canvas, qrContent, {
            width: 200,
            margin: 2,
            color: {
                dark: '#166534', // Green-800
                light: '#FFFFFF'
            }
        })

        console.log('QR Code generated for number switching:', cleanNumber)
    } catch (error) {
        console.error('Error generating QR code:', error)
    }
}

function hideQRCode() {
    showQRCode.value = false
    qrData.value = {}
}

// Watch untuk show company QR
watch(() => props.showCompanyQR, async (data) => {
    if (data && data.phoneNumber) {
        qrData.value = {
            name: data.name || 'Ganti Nomor WhatsApp',
            phoneNumber: data.phoneNumber
        }
        showQRCode.value = true

        // Generate QR code setelah DOM update
        await nextTick()
        await generateQRCode(data.phoneNumber)
    }
})

// Get WhatsApp status
const getWhatsAppStatus = async () => {
    try {
        const { data } = await axios.get("http://localhost:3000/api/whatsapp/status")
        if (data.success && data.status.phoneNumber) {
            currentWhatsAppId.value = data.status.phoneNumber
        }
    } catch (error) {
        console.error("Gagal mendapatkan status WhatsApp:", error)
    }
}

// Watcher untuk pesan baru dari socket
watch(() => props.newMessage, async (newMsg) => {
    if (!newMsg || !newMsg.message_id || showQRCode.value) return

    console.log('New message received:', newMsg)

    const selectedContactId = props.selectedContact?.whatsappId ||
        props.selectedContact?.contactNumber ||
        props.selectedContact?.phoneNumber

    if (selectedContactId && newMsg.sender_id === selectedContactId) {
        const exists = messages.value.find(m => m.message_id === newMsg.message_id)
        if (!exists) {
            messages.value.push({
                message_id: newMsg.message_id,
                sender_id: newMsg.sender_id,
                receiver_id: newMsg.receiver_id,
                text: newMsg.text,
                created_at: newMsg.timestamp,
                send_by: 'user'
            })

            await nextTick()
            scrollToBottom()
        }
    }
})

// Watcher untuk kontak yang dipilih
watch(() => props.selectedContact, async (newContact) => {
    if (!newContact) {
        messages.value = []
        hideQRCode()
        return
    }

    hideQRCode()
    await loadMessages(newContact)
}, { immediate: true })

// Load messages untuk kontak tertentu
const loadMessages = async (contact) => {
    if (!contact) return

    const contactId = contact.whatsappId || contact.contactNumber || contact.phoneNumber
    if (!contactId) return

    isLoading.value = true
    try {
        console.log('Loading messages for:', contactId)
        const { data } = await axios.get(`http://localhost:3000/api/messages?sender=${contactId}`)

        if (data.success) {
            // loadMessages function
            messages.value = data.messages.map(msg => ({
                _id: msg._id,
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                text: msg.text,
                created_at: msg.created_at,
                send_by: msg.send_by,
                timestamp: msg.timestamp || msg.created_at
            }))

            console.log(`Loaded ${messages.value.length} messages`)

            await nextTick()
            scrollToBottom()
        }
    } catch (error) {
        console.error("Gagal mengambil pesan:", error)
    } finally {
        isLoading.value = false
    }
}

// Send message function
const sendMessage = async () => {
    if (!inputMessage.value.trim() || !props.selectedContact) return

    const messageText = inputMessage.value.trim()
    const tempId = `temp_${Date.now()}`

    const targetNumber = props.selectedContact.whatsappId ||
        props.selectedContact.contactNumber ||
        props.selectedContact.phoneNumber

    if (!targetNumber) {
        console.error('No target number found')
        alert('Nomor kontak tidak ditemukan')
        return
    }

    const tempMessage = {
        message_id: tempId,
        sender_id: currentWhatsAppId.value || currentUserId,
        receiver_id: targetNumber,
        text: messageText,
        created_at: new Date().toISOString(),
        send_by: "system"
    }

    messages.value.push(tempMessage)
    inputMessage.value = ""

    await nextTick()
    scrollToBottom()

    try {
        const response = await axios.post("http://localhost:3000/send-message", {
            number: targetNumber,
            message: messageText,
            sender_id: currentUserId
        })

        if (response.data.success) {
            console.log('✅ Message sent successfully')
            const tempIndex = messages.value.findIndex(m => m.message_id === tempId)
            if (tempIndex !== -1) {
                messages.value[tempIndex].message_id = response.data.messageId || tempId
            }
        } else {
            throw new Error(response.data.error || 'Gagal mengirim pesan')
        }

    } catch (error) {
        console.error("❌ Error sending message:", error)

        const tempIndex = messages.value.findIndex(m => m.message_id === tempId)
        if (tempIndex !== -1) {
            messages.value.splice(tempIndex, 1)
        }

        let errorMessage = 'Gagal mengirim pesan'
        if (error.response?.data?.error) {
            errorMessage = error.response.data.error
        } else if (error.response?.status === 503) {
            errorMessage = 'WhatsApp belum siap, silakan tunggu atau scan QR code'
        } else if (error.response?.status === 500) {
            errorMessage = 'Server error, silakan coba lagi'
        }

        alert(errorMessage)
    }
}

// Scroll functions
const handleScroll = () => {
    const container = chatContainer.value
    if (!container) return

    const threshold = 100
    const position = container.scrollTop + container.clientHeight
    const height = container.scrollHeight
    isUserNearBottom.value = position + threshold >= height
}

const scrollToBottom = () => {
    const container = chatContainer.value
    if (container) {
        container.scrollTop = container.scrollHeight
    }
}

// Format waktu
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(async () => {
    console.log('WhatsappChat mounted')
    await getWhatsAppStatus()
})
</script>
<style scoped>
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
    background: #22c55e;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>