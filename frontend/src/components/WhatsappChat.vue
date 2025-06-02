<template>
    <div class="flex flex-col h-full bg-gray-100">
      <main
        ref="chatContainer"
        class="flex-grow p-4 overflow-y-auto bg-gray-400 max-h-full"
        @scroll.passive="handleScroll"
      >
        <div
          v-for="message in messages"
          :key="message.message_id"
          class="flex"
          :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
        >
          <div
            class="relative max-w-xs mt-1 p-2 rounded-lg text-black"
            :class="message.sender_id === currentUserId ? 'bg-green-600 text-white' : 'bg-green-200'"
          >
            {{ message.text }}
          </div>
        </div>
      </main>
  
      <footer class="bg-white p-4">
        <div class="container mx-auto flex gap-2">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Ketik pesan..."
            class="flex-grow p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
            @keyup.enter="sendMessage"
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
  import { ref, onMounted, nextTick, watch, defineProps } from "vue";
  
  export default {
    props: {
      newMessage: {
        type: Object,
        default: null,
      },
      selectedContact: {
  type: Object,
  default: null,
},

    },
    setup(props) {
      const messages = ref([]);
      const inputMessage = ref("");
      const currentUserId = "user_3"; // Pastikan ini string
      const chatContainer = ref(null);
      const isUserNearBottom = ref(true);
  
      // Watcher: terima pesan baru dari prop newMessage
      watch(
  () => props.newMessage,
  async (val) => {
    if (val && val.message_id) {
      // Hanya proses pesan dari kontak yang aktif (selectedContact)
      if (props.selectedContact && val.sender_id === props.selectedContact.contactNumber) {
        // Cegah duplikasi pesan
        if (!messages.value.find((m) => m.message_id === val.message_id)) {
          messages.value.push(val);
          await nextTick();
          scrollToBottomIfNeeded();
        }
      }
    }
  }
);

watch(
  () => props.selectedContact,
  async (newContact) => {
    if (!newContact || !newContact.contactNumber) {
      messages.value = [];
      return;
    }
    try {
      const { data } = await axios.get(`http://localhost:3000/api/messages?sender=${newContact.contactNumber}`);
      if (data.success) {
        messages.value = data.messages.map((msg) => ({
          message_id: msg._id,
          sender_id: String(msg.sender_id),
          text: msg.text,
          created_at: msg.created_at,
        }));
        await nextTick();
        scrollToBottom();
      }
    } catch (error) {
      console.error("Gagal mengambil pesan:", error);
    }
  },
  { immediate: true }
);


  
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
  
      const saveMessagesToLocalStorage = () => {
        localStorage.setItem(
          "messages",
          JSON.stringify(
            messages.value.map((m) => ({
              ...m,
              sender_id: String(m.sender_id),
            }))
          )
        );
      };
  
      const loadMessagesFromLocalStorage = () => {
        const stored = localStorage.getItem("messages");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            messages.value = parsed.map((msg) => ({
              ...msg,
              sender_id: String(msg.sender_id),
            }));
          } catch {
            messages.value = [];
          }
        }
      };
  
      const fetchMessages = async () => {
        try {
          const { data } = await axios.get("http://localhost:3000/api/messages");
          if (data.success) {
            messages.value = data.messages.map((msg) => ({
              message_id: msg._id,
              sender_id: String(msg.sender_id),
              text: msg.text,
              created_at: msg.created_at,
            }));
            saveMessagesToLocalStorage();
            await nextTick();
            scrollToBottom();
          }
        } catch (error) {
          console.error("Gagal mengambil pesan:", error);
        }
      };
  
      // Ambil pesan masuk baru secara periodik (opsional, bisa diganti realtime socket)
      const fetchReceivedMessages = async () => {
        try {
          const { data } = await axios.get("http://localhost:3000/receive-message");
          if (data.success) {
            const existingIds = new Set(messages.value.map((m) => m.message_id));
            let isNewMessageAdded = false;
  
            data.messages.forEach((message) => {
              if (!existingIds.has(message._id)) {
                messages.value.push({
                  message_id: message._id,
                  sender_id: String(message.sender_id),
                  text: message.text,
                  created_at: message.created_at,
                });
                isNewMessageAdded = true;
              }
            });
  
            if (isNewMessageAdded) {
              saveMessagesToLocalStorage();
              await nextTick();
              scrollToBottomIfNeeded();
            }
          }
        } catch (error) {
          console.error("Gagal mengambil pesan masuk:", error);
        }
      };
  
      const sendMessage = async () => {
        if (!inputMessage.value.trim()) return;
  
        const tempMessage = {
          message_id: `temp_${Date.now()}`,
          sender_id: currentUserId,
          text: inputMessage.value,
          created_at: new Date().toISOString(),
          status: "pending",
        };
  
        messages.value.push(tempMessage);
        saveMessagesToLocalStorage();
        inputMessage.value = "";
        await nextTick();
        scrollToBottomIfNeeded();
  
        try {
          const numberToSend = props.selectedContact ? props.selectedContact.contactNumber : "6285156275875";

const { data } = await axios.post("http://localhost:3000/send-message", {
  number: numberToSend,
  message: tempMessage.text,
  sender_id: currentUserId,
});

  
          if (data.success) {
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
          tempMessage.status = "failed";
          saveMessagesToLocalStorage();
        }
      };
  
      let pollingTimeout = null;
      const startPolling = () => {
        if (pollingTimeout) clearTimeout(pollingTimeout);
        pollingTimeout = setTimeout(async () => {
          await fetchReceivedMessages();
          startPolling();
        }, 3000);
      };
  
      onMounted(() => {
        loadMessagesFromLocalStorage();
        fetchMessages();
        startPolling();
      });
  
      return {
        messages,
        inputMessage,
        sendMessage,
        chatContainer,
        handleScroll,
        currentUserId,
      };
    },
  };
  </script>
  