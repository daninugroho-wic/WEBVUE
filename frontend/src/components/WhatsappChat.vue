<template>
    <div class="flex flex-col h-full">
        <!-- =============== CHAT HEADER =============== -->
        <div v-if="selectedContact" class="bg-white border-b border-green-200 p-4">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                    <h3 class="font-medium text-gray-900">
                        {{ selectedContact.name || selectedContact.contactNumber || selectedContact.whatsappId }}
                    </h3>
                    <p class="text-sm text-green-500">
                        {{ selectedContact.phoneNumber || selectedContact.contactNumber || selectedContact.whatsappId }}
                    </p>
                </div>
            </div>
        </div>

        <!-- =============== CHAT MESSAGES CONTAINER =============== -->
        <div 
            ref="chatContainer" 
            @scroll="handleScroll" 
            class="flex-1 overflow-y-auto p-4 space-y-4 bg-green-50"
        >
            <!-- Loading State -->
            <div v-if="isLoading && messages.length === 0" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>

            <!-- QR Code Display -->
            <div v-else-if="showQRCode" class="flex items-center justify-center h-full">
                <div class="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-green-900 mb-2">{{ qrData.name }}</h3>
                        <p class="text-green-700 font-medium">{{ qrData.phoneNumber }}</p>
                    </div>

                    <!-- QR Code Canvas -->
                    <div class="bg-white p-4 rounded-xl border-2 border-green-200 mb-4 mx-auto inline-block">
                        <canvas ref="qrCanvas" class="mx-auto"></canvas>
                    </div>

                    <p class="text-sm text-gray-600 mb-4">
                        Scan QR Code ini untuk mengganti nomor WhatsApp
                    </p>

                    <button 
                        @click="hideQRCode"
                        class="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                        ✕ Tutup
                    </button>
                </div>
            </div>

            <!-- Empty State - No Contact Selected -->
            <div v-else-if="!selectedContact" class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 class="text-lg font-medium mb-2">Welcome to WhatsApp Chat</h3>
                    <p class="text-sm">Pilih kontak untuk memulai chat</p>
                    <p class="text-xs text-gray-400 mt-2">atau klik nomor perusahaan untuk ganti nomor</p>
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
                <div 
                    v-for="message in messages" 
                    :key="message.message_id" 
                    :class="[
                        'flex',
                        isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'
                    ]"
                >
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

        <!-- =============== MESSAGE INPUT =============== -->
        <div v-if="selectedContact && !showQRCode" class="bg-white border-t border-green-200">
            <!-- Quick Replies Section - Compact Design -->
            <div class="px-4  border-b border-green-100">
                <button 
                    @click="toggleQuickReplies" 
                    class="flex items-center justify-between w-full text-left hover:bg-green-50 rounded-lg px-2 py-1 transition-colors"
                >
                    <span class="text-sm font-medium text-gray-700">Balasan Cepat</span>
                    <svg 
                        :class="[
                            'w-4 h-4 text-green-600 transition-transform duration-200',
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
                        class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors duration-200"
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
                        class="flex-1 border border-green-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        :disabled="isLoading" 
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <button 
                        type="submit" 
                        :disabled="!inputMessage.trim() || isLoading"
                        class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
import QRCode from 'qrcode'

// =============== PROPS & EMITS ===============
const props = defineProps({
    newMessage: Object,
    selectedContact: Object,
    showCompanyQR: Object
})

// =============== REACTIVE STATE ===============
const messages = ref([])
const inputMessage = ref("")
const chatContainer = ref(null)
const isUserNearBottom = ref(true)
const isLoading = ref(false)

// QR Code related state
const showQRCode = ref(false)
const qrData = ref({})
const qrCanvas = ref(null)

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
const currentUserId = "user_3"
const currentWhatsAppId = ref(null)

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

const scrollToBottomIfNeeded = () => {
    if (chatContainer.value && isUserNearBottom.value) {
        setTimeout(() => {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }, 10)
    }
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

// =============== QR CODE FUNCTIONS ===============
const generateQRCode = async (phoneNumber) => {
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

        console.log('✅ QR Code generated for number switching:', cleanNumber)
    } catch (error) {
        console.error('❌ Error generating QR code:', error)
    }
}

const hideQRCode = () => {
    showQRCode.value = false
    qrData.value = {}
}

// =============== API FUNCTIONS ===============
const getWhatsAppStatus = async () => {
    try {
        const { data } = await axios.get("http://localhost:3000/api/whatsapp/status")
        
        if (data.success && data.status.phoneNumber) {
            currentWhatsAppId.value = data.status.phoneNumber
            console.log('✅ Current WhatsApp user:', currentWhatsAppId.value)
        }
    } catch (error) {
        console.error('❌ Failed to get WhatsApp status:', error)
    }
}

const loadMessages = async (contact) => {
    if (!contact) return

    const contactId = getContactId(contact)
    if (!contactId) return

    isLoading.value = true
    
    try {
        console.log('🔄 Loading WhatsApp messages for:', contactId)
        
        const { data } = await axios.get(`http://localhost:3000/api/messages`, {
            params: { sender: contactId }
        })

        if (data.success) {
            messages.value = data.messages.map(normalizeMessage)
            console.log(`✅ Loaded ${messages.value.length} messages`)

            await nextTick()
            forceScrollToBottom()
        }
    } catch (error) {
        console.error('❌ Failed to load messages:', error)
        // Keep existing messages on error to maintain UI state
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
    const targetNumber = getContactId(props.selectedContact)

    if (!targetNumber) {
        console.error('❌ No target number found')
        alert('Nomor kontak tidak ditemukan')
        return
    }

    // Create temporary message for optimistic UI update
    const tempMessage = createTempMessage(messageText, targetNumber)

    // Add message to UI immediately
    messages.value.push(tempMessage)
    inputMessage.value = ""
    forceScrollToBottom()

    try {
        console.log('📤 Sending WhatsApp message:', messageText)

        const requestData = {
            number: targetNumber,
            message: messageText,
            sender_id: currentUserId
        }

        const { data } = await axios.post("http://localhost:3000/send-message", requestData)

        if (data.success) {
            // Update temp message with real data
            updateTempMessage(tempMessage.message_id, data.messageId)
            console.log('✅ WhatsApp message sent successfully')
        } else {
            throw new Error(data.error || 'Gagal mengirim pesan')
        }

    } catch (error) {
        console.error('❌ Failed to send message:', error)

        // Remove failed temp message
        removeTempMessage(tempMessage.message_id)

        // Show error message
        const errorMessage = getErrorMessage(error)
        alert(errorMessage)
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
    message_id: msg.message_id || msg._id,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    text: msg.text,
    created_at: msg.created_at,
    send_by: msg.send_by,
    timestamp: msg.timestamp || msg.created_at
})

const createTempMessage = (text, targetNumber) => ({
    message_id: `temp_${Date.now()}`,
    sender_id: currentWhatsAppId.value || currentUserId,
    receiver_id: targetNumber,
    text,
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    send_by: "system",
    isTemp: true
})

const updateTempMessage = (tempId, realId) => {
    const tempIndex = messages.value.findIndex(m => m.message_id === tempId)
    if (tempIndex !== -1) {
        messages.value[tempIndex] = {
            ...messages.value[tempIndex],
            message_id: realId || tempId,
            isTemp: false
        }
    }
}

const removeTempMessage = (tempId) => {
    const tempIndex = messages.value.findIndex(m => m.message_id === tempId)
    if (tempIndex !== -1) {
        messages.value.splice(tempIndex, 1)
    }
}

const getContactId = (contact) => {
    return contact.whatsappId || contact.contactNumber || contact.phoneNumber
}

const getErrorMessage = (error) => {
    if (error.response?.data?.error) {
        return error.response.data.error
    } else if (error.response?.status === 503) {
        return 'WhatsApp belum siap, silakan tunggu atau scan QR code'
    } else if (error.response?.status === 500) {
        return 'Server error, silakan coba lagi'
    }
    return 'Gagal mengirim pesan'
}

const isMessageFromCurrentUser = (message) => {
    return message.sender_id === currentWhatsAppId.value || 
           message.send_by === 'system'
}

const isMessageForCurrentContact = (newMsg) => {
    const selectedContactId = getContactId(props.selectedContact)
    return selectedContactId && newMsg.sender_id === selectedContactId
}

const isMessageDuplicate = (messageId) => {
    return messages.value.some(m => m.message_id === messageId)
}

// =============== WATCHERS ===============
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

watch(() => props.newMessage, async (newMsg) => {
    if (!newMsg || !newMsg.message_id || showQRCode.value) return

    console.log('👀 New WhatsApp message received:', newMsg)

    // Only add if message is for current active contact
    if (isMessageForCurrentContact(newMsg)) {
        // Check for duplicates
        if (!isMessageDuplicate(newMsg.message_id)) {
            console.log('➕ Adding new message to chat')

            messages.value.push({
                message_id: newMsg.message_id,
                sender_id: newMsg.sender_id,
                receiver_id: newMsg.receiver_id,
                text: newMsg.text,
                created_at: newMsg.timestamp,
                timestamp: newMsg.timestamp,
                send_by: 'user'
            })

            forceScrollToBottom()
        }
    }
})

watch(() => props.selectedContact, async (newContact) => {
    if (!newContact) {
        messages.value = []
        hideQRCode()
        return
    }

    console.log('🔄 Contact changed, loading messages for:', getContactId(newContact))
    hideQRCode()
    await loadMessages(newContact)
}, { immediate: true })

// =============== LIFECYCLE ===============
onMounted(async () => {
    console.log('📱 WhatsappChat mounted')
    await getWhatsAppStatus()
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
    background: #22c55e;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>