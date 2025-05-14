<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <main class="flex-grow p-4 overflow-y-auto bg-gray-400" ref="chatContainer">
  <div
    v-for="(message, index) in messages"
    :key="message.message_id"
    class="flex"
    :class="message.sender_id !== currentUserId ? 'justify-end' : 'justify-start'"
  >
    <div
      class="relative max-w-xs mt-1 p-2 rounded-lg text-black"
      :class="message.sender_id !== currentUserId ? 'bg-green-600 text-white' : 'bg-green-200'"
    >
      {{ message.text }}
    </div>
  </div>
</main>

    <footer class="bg-white p-4">
      <div class="container mx-auto flex gap-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Ketik pesan..."
          class="flex-grow p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
        />
        <button @click="sendMessage" class="bg-green-500 text-white px-4 py-2 rounded-lg">
          Kirim
        </button>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from "axios";
import { ref, onMounted, nextTick } from "vue";

export default {
  setup() {
    const messages = ref([]);
    const newMessage = ref("");
    const currentUserId = ref("user_3"); // ID pengguna saat ini
    const chatContainer = ref(null);

    // Fungsi untuk mengambil pesan dari backend
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

    // Fungsi untuk mengirim pesan
    const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const tempMessage = {
      message_id: `message_${messages.value.length + 1}`,
      sender_id: currentUserId.value,
      text: newMessage.value, // Gunakan "text" konsisten
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "pending",
    };

    // Tambahkan pesan sementara ke UI
    messages.value.push(tempMessage);
    saveMessagesToLocalStorage();
    newMessage.value = "";

    // Kirim pesan ke server
    try {
      const response = await axios.post("http://localhost:3000/send-message", {
        number: "6285156275875",
        message: tempMessage.text, // Gunakan "text" konsisten
        sender_id: currentUserId.value, // Tambahkan sender_id
      });

      if (response.data.success) {
        tempMessage.status = "sent";
        saveMessagesToLocalStorage();

        // Simulasi penerimaan pesan
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

// Fungsi untuk menyimpan pesan ke localStorage
const saveMessagesToLocalStorage = () => {
  localStorage.setItem("messages", JSON.stringify(messages.value));
};

    // Fungsi untuk menggulir ke bawah
    const scrollToBottom = () => {
      const container = chatContainer.value;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Fungsi untuk mengambil pesan masuk secara periodik
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
          nextTick(scrollToBottom);
        }
      } catch (error) {
        console.error("Gagal mengambil pesan masuk:", error);
      }
    };

    // Lifecycle hook untuk inisialisasi
    onMounted(() => {
      fetchMessages();
      setInterval(fetchReceivedMessages, 3000); // Ambil pesan masuk setiap 3 detik
    });

    return {
      messages,
      newMessage,
      sendMessage,
      chatContainer,
    };
  },
};
</script>