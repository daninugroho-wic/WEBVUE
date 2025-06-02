<template>
    <div class="h-full w-full bg-green-50 shadow-xl p-5 overflow-y-auto flex flex-col">
      <h2 class="text-2xl font-bold text-green-900 mb-6 border-b border-green-300 pb-2">WHATSAPP</h2>
  
      <!-- Nomor Perusahaan -->
      <div
        class="flex items-center gap-4 p-4 mb-6 bg-green-100 border border-green-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-default"
      >
        <div
          class="w-14 h-14 bg-green-400 rounded-full flex items-center justify-center text-white text-2xl font-extrabold select-none"
          aria-label="Phone icon"
        >
          📞
        </div>
        <div>
          <p class="font-semibold text-green-900 tracking-wide select-text">Nomor Perusahaan</p>
          <p class="text-green-700 text-sm tracking-wide select-text">{{ companyPhone }}</p>
        </div>
      </div>
  
      <!-- Daftar Kontak -->
      <div class="flex flex-col gap-3 flex-grow overflow-y-auto">
        <div
          v-for="(contact, index) in contacts"
          :key="contact.contactNumber || index"
          class="flex items-center gap-4 p-3 bg-white rounded-xl shadow hover:bg-green-100 cursor-pointer transition-colors"
          role="button"
          tabindex="0"
          @click="selectContact(contact)"
          @keydown.enter="selectContact(contact)"
        >
          <div
            class="w-14 h-14 bg-green-300 rounded-full flex items-center justify-center text-green-900 font-semibold text-xl select-none"
            aria-label="User icon"
          >
            👤
          </div>
          <div class="flex flex-col overflow-hidden">
            <p class="font-semibold text-green-900 truncate select-text">
              {{ contact.name || contact.contactNumber }}
            </p>
            <p class="text-green-700 text-sm truncate select-text" title="Last message">
              {{ contact.lastMessage || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, defineEmits, onMounted } from "vue";
  import axios from "axios";
  
  const companyPhone = ref("+62 838-6647-4123");
  
  // Contacts array diisi dengan data kontak
  const contacts = ref([]);
  
  // Emit event ke parent ketika kontak dipilih
  const emit = defineEmits(["select-contact"]);
  
  // Fungsi ambil kontak dari backend
  async function fetchContacts() {
    try {
      const { data } = await axios.get("http://localhost:3000/api/conversations");
      if (data.success) {
        contacts.value = data.conversations;
      }
    } catch (error) {
      console.error("Gagal mengambil kontak:", error);
    }
  }
  
  // Props dari parent untuk terima pesan baru realtime
  const props = defineProps({
    newMessage: Object,
  });
  
  // Watcher untuk update kontak saat ada pesan baru
  watch(
    () => props.newMessage,
    (msg) => {
      if (!msg || !msg.sender_id) return;
  
      const idx = contacts.value.findIndex(
        (c) => c.contactNumber === msg.sender_id
      );
  
      if (idx !== -1) {
        // Update pesan terakhir dan timestamp
        contacts.value[idx].lastMessage = msg.text;
        contacts.value[idx].lastTimestamp = msg.timestamp;
  
        // Pindahkan kontak ke paling atas
        const updatedContact = contacts.value.splice(idx, 1)[0];
        contacts.value.unshift(updatedContact);
      } else {
        // Kontak baru muncul otomatis
        contacts.value.unshift({
          contactNumber: msg.sender_id,
          lastMessage: msg.text,
          lastTimestamp: msg.timestamp,
          name: null, // Bisa kamu isi nama dari database atau API
        });
      }
    }
  );
  
  // Fungsi saat kontak dipilih
  function selectContact(contact) {
    emit("select-contact", contact);
  }
  
  // Panggil API kontak saat komponen mount
  onMounted(() => {
    fetchContacts();
  });
  </script>
  