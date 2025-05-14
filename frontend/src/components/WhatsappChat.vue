<template>
<div class="flex flex-col min-h-screen bg-gray-100">
    <main class="flex-grow p-4 overflow-y-auto bg-gray-400 max-h-[calc(100vh-74px)]" ref="chatContainer" @scroll.passive="handleScroll">
        <div v-for="(message, index) in messages" :key="message.message_id" class="flex" :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'">
            <div class="relative max-w-xs mt-1 p-2 rounded-lg text-black" :class="message.sender_id === currentUserId ? 'bg-green-600 text-white' : 'bg-green-200'">
                {{ message.text }}
            </div>
        </div>
    </main>

    <footer class="bg-white p-4">
        <div class="container mx-auto flex gap-2">
            <input v-model="newMessage" type="text" placeholder="Ketik pesan..." class="flex-grow p-2 rounded-lg border border-gray-300 bg-white focus:outline-none" @keyup.enter="sendMessage" />
            <button @click="sendMessage" class="bg-green-500 text-white px-4 py-2 rounded-lg">
                Kirim
            </button>
        </div>
    </footer>
</div>
</template>

<script>
import axios from "axios";
import {
    ref,
    onMounted,
    nextTick
} from "vue";

export default {
    setup() {
        const messages = ref([]);
        const newMessage = ref("");
        const currentUserId = "user_3";
        const chatContainer = ref(null);
        const isUserNearBottom = ref(true);

        const handleScroll = () => {
            const container = chatContainer.value;
            if (!container) return;
            const threshold = 100;
            const position = container.scrollTop + container.clientHeight;
            const height = container.scrollHeight;
            isUserNearBottom.value = position + threshold >= height;
        };

        const scrollToBottomIfNeeded = () => {
            const container = chatContainer.value;
            if (container && isUserNearBottom.value) {
                container.scrollTop = container.scrollHeight;
            }
        };

        const scrollToBottom = () => {
            const container = chatContainer.value;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        };

        const fetchMessages = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/messages");
                if (response.data.success) {
                    messages.value = response.data.messages.map((message) => ({
                        message_id: message._id,
                        sender_id: message.sender_id,
                        text: message.text,
                        created_at: message.created_at,
                    }));
                    nextTick(scrollToBottom);
                }
            } catch (error) {
                console.error("Gagal mengambil pesan:", error);
            }
        };

        const sendMessage = async () => {
            if (newMessage.value.trim()) {
                const tempMessage = {
                    message_id: `message_${Date.now()}`,
                    sender_id: currentUserId,
                    text: newMessage.value,
                    created_at: new Date().toISOString(),
                    status: "pending",
                };

                messages.value.push(tempMessage);
                saveMessagesToLocalStorage();
                newMessage.value = "";
                nextTick(scrollToBottomIfNeeded);

                try {
                    const response = await axios.post("http://localhost:3000/send-message", {
                        number: "6285156275875",
                        message: tempMessage.text,
                        sender_id: currentUserId,
                    });

                    if (response.data.success) {
                        tempMessage.status = "sent";
                        saveMessagesToLocalStorage();

                        setTimeout(() => {
                            tempMessage.status = "delivered";
                            saveMessagesToLocalStorage();

                            setTimeout(() => {
                                tempMessage.status = "read";
                                saveMessagesToLocalStorage();
                            }, 2000);
                        }, 1000);
                    }
                } catch (error) {
                    console.error("Gagal mengirim pesan:", error);
                }
            }
        };

        const fetchReceivedMessages = async () => {
            try {
                const response = await axios.get("http://localhost:3000/receive-message");
                if (response.data.success) {
                    response.data.messages.forEach((message) => {
                        if (!messages.value.some((m) => m.message_id === message._id)) {
                            messages.value.push({
                                message_id: message._id,
                                sender_id: message.sender_id,
                                text: message.text,
                                created_at: message.created_at,
                            });
                        }
                    });
                    nextTick(scrollToBottomIfNeeded);
                }
            } catch (error) {
                console.error("Gagal mengambil pesan masuk:", error);
            }
        };

        const saveMessagesToLocalStorage = () => {
            localStorage.setItem("messages", JSON.stringify(messages.value));
        };

        const loadMessagesFromLocalStorage = () => {
            const stored = localStorage.getItem("messages");
            if (stored) {
                messages.value = JSON.parse(stored);
            }
        };

        onMounted(() => {
            loadMessagesFromLocalStorage();
            fetchMessages();
            setInterval(fetchReceivedMessages, 3000);
        });

        return {
            messages,
            newMessage,
            sendMessage,
            chatContainer,
            handleScroll,
            currentUserId,
        };
    },
};
</script>
