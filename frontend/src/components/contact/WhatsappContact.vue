<template>
  <div class="h-full w-full bg-green-50 shadow-xl p-5 flex flex-col">
    <!-- Bagian atas: Judul & Nomor Perusahaan -->
    <div>
      <h2 class="text-2xl font-bold text-green-900 mb-6 border-b border-green-300 pb-2">WHATSAPP</h2>

      <div
        class="flex items-center gap-4 p-4 mb-6 bg-green-100 border border-green-300 rounded-xl shadow-inner hover:shadow-md transition-shadow cursor-default">
        <div
          class="w-14 h-14 bg-green-400 rounded-full flex items-center justify-center text-white text-2xl font-extrabold select-none"
          aria-label="Phone icon">
          📞
        </div>
        <div>
          <p class="font-semibold text-green-900 tracking-wide select-text">Nomor Perusahaan</p>
          <p class="text-green-700 text-sm tracking-wide select-text">{{ companyPhone }}</p>
        </div>
      </div>
    </div>

    <!-- Bagian bawah: Daftar Kontak, ini scrollable -->
    <div class="flex-grow overflow-y-auto min-h-0 flex flex-col gap-3 hide-scrollbar">
      <div v-for="(contact, index) in contacts" :key="contact.whatsappId || index"
        class="flex items-center gap-4 p-3 bg-white rounded-xl shadow hover:bg-green-100 cursor-pointer transition-colors"
        role="button" tabindex="0" @click="selectContact(contact)" @keydown.enter="selectContact(contact)">
        <div
          class="w-14 h-14 bg-green-300 rounded-full flex items-center justify-center text-green-900 font-semibold text-xl select-none"
          aria-label="User icon">
          👤
        </div>
        <div class="flex flex-col overflow-hidden">
          <p class="font-semibold text-green-900 truncate select-text">
            {{ contact.name || contact.whatsappId }}
          </p>
          <p class="text-green-700 text-sm truncate select-text" title="Last message">
            {{ contact.lastMessage || 'Tidak ada pesan' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import axios from "axios";

const companyPhone = ref("+62 838-6647-4123");

// Kontak array diisi dengan data kontak
const contacts = ref([]);

// Emit event ke parent ketika kontak dipilih
const emit = defineEmits(["select-contact"]);

// Fungsi untuk memuat kontak dari localStorage
function loadContactsFromLocalStorage() {
  const storedContacts = localStorage.getItem('contacts');
  if (storedContacts) {
    contacts.value = JSON.parse(storedContacts);
  }
}

// Fungsi untuk ambil kontak dari backend dan simpan ke localStorage
async function fetchContacts() {
  try {
    const { data } = await axios.get("http://localhost:3000/api/contacts");
    if (data.success) {
      const updatedContacts = data.contacts.map(contact => ({
        whatsappId: contact.whatsappId,
        name: contact.name || contact.whatsappId,
        phoneNumber: contact.phoneNumber,
        profilePicUrl: contact.profilePicUrl || '',
        lastMessage: contact.lastMessage || 'Tidak ada pesan',
        lastTimestamp: contact.lastTimestamp || null,
        isBlocked: contact.isBlocked || false,
      }));
      contacts.value = updatedContacts;
      saveContactsToLocalStorage();
    }
  } catch (error) {
    console.error("Gagal mengambil kontak:", error);
    console.log(contacts.value);
  }
}

// Fungsi untuk menyimpan kontak ke localStorage
function saveContactsToLocalStorage() {
  localStorage.setItem('contacts', JSON.stringify(contacts.value));
}

// Fungsi untuk menyimpan kontak baru ke database
async function saveContactToDatabase(contact) {
  try {
    await axios.post("http://localhost:3000/api/contacts", contact);
  } catch (error) {
    console.error("Gagal menyimpan kontak baru ke database:", error);
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
      (c) => c.whatsappId === msg.sender_id
    );

    if (idx !== -1) {
      // Update pesan terakhir dan timestamp
      contacts.value[idx].lastMessage = msg.text;
      contacts.value[idx].lastTimestamp = msg.timestamp;

      // Pindahkan kontak ke paling atas
      const updatedContact = contacts.value.splice(idx, 1)[0];
      contacts.value.unshift(updatedContact);

      saveContactsToLocalStorage();
    } else {
      // Kontak baru muncul otomatis
      const newContact = {
        whatsappId: msg.sender_id,
        lastMessage: msg.text,
        lastTimestamp: msg.timestamp,
        name: null,
        isBlocked: false,
      };

      contacts.value.unshift(newContact);
      saveContactsToLocalStorage();
      saveContactToDatabase(newContact);
    }
  }
);

// Fungsi saat kontak dipilih
function selectContact(contact) {
  emit("select-contact", contact);
}

// Panggil API kontak saat komponen mount
onMounted(() => {
  loadContactsFromLocalStorage(); // Memuat kontak dari localStorage
  fetchContacts(); // Ambil kontak dari backend jika perlu
});
</script>