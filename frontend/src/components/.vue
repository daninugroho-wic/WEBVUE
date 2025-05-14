<template>
  <div class="flex h-screen">
    <!-- Sidebar (Kiri) -->
    <aside class="w-1/4 bg-gray-100 border-r border-gray-300 p-4">
      <div class="mb-4">
        <div class="bg-gray-300 h-24 w-24 rounded-full mx-auto mb-2"></div>
        <div class="text-center font-bold">No Perusahaan</div>
        <div class="text-center text-sm">08386647123</div>
      </div>

      <div class="font-bold text-sm mb-2 border-b pb-1">CHAT CUSTOMER</div>
      <div v-for="(contact, index) in contacts" :key="index" class="flex items-center justify-between p-2 hover:bg-green-100 cursor-pointer border rounded mb-2">
        <div class="flex items-center gap-2">
          <div class="bg-gray-400 h-10 w-10 rounded-full"></div>
          <div>
            <div class="font-semibold">Customer {{ contact.id }}</div>
            <div class="text-xs text-gray-600 truncate">Halo, Perkenalkan saya pelanggan {{ contact.id }}</div>
          </div>
        </div>
        <button @click="deleteContact(index)" class="text-red-500 hover:text-red-700">
          🗑️
        </button>
      </div>
    </aside>

    <!-- Chat Panel (Kanan) -->
    <section class="flex flex-col flex-1 bg-green-50">
      <main class="flex-1 p-4 overflow-y-auto">
        <div v-for="(msg, idx) in messages" :key="idx" class="mb-2 flex"
             :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'">
          <div class="relative max-w-xs p-2 rounded-lg text-sm text-black"
               :class="msg.sender === 'me' ? 'bg-green-600 text-white' : 'bg-green-200'">
            <div>{{ msg.text }}</div>
            <div class="text-[10px] text-right mt-1">{{ msg.time }}</div>
          </div>
        </div>
      </main>

      <footer class="p-3 bg-white border-t flex">
        <input v-model="newMessage" placeholder="Message" class="flex-1 border rounded p-2 mr-2" />
        <button @click="sendMessage" class="px-4 py-2 bg-black text-white rounded">Send</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const contacts = ref([
  { id: 1 }, { id: 2 }, { id: 3 },
  { id: 4 }, { id: 5 }, { id: 6 }
])

const messages = ref([
  { text: "10.30 pm", sender: "me", time: "10.30 pm" },
  { text: "10.35 pm", sender: "other", time: "10.35 pm" },
  { text: "11.02 pm", sender: "other", time: "11.02 pm" },
  { text: "10.50 pm", sender: "me", time: "10.50 pm" },
  { text: "11.10 pm", sender: "me", time: "11.10 pm" },
  { text: "11.20 pm", sender: "other", time: "11.20 pm" },
])

const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim() === '') return
  messages.value.push({
    text: newMessage.value,
    sender: 'me',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  newMessage.value = ''
}

const deleteContact = (index) => {
  contacts.value.splice(index, 1)
}
</script>

____________________________________________________________________________-

<template>
    <div class="h-full w-full bg-white shadow-lg p-4">
      <!-- Header -->
      <div class="text-center mb-4">
        <h2 class="text-2xl font-bold text-black">WHATSAPP</h2>
      </div>
  
      <!-- Info Perusahaan -->
      <div class="flex flex-col items-center mb-4">
        <div class="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
        <p class="font-semibold text-sm text-black">No Perusahaan</p>
        <p class="text-xs text-gray-600">08386647123</p>
      </div>
  
      <!-- Label Chat -->
      <div class="text-sm font-semibold text-gray-600 border-y py-2 mb-2">
        CHAT CUSTOMER
      </div>
  
      <!-- Daftar Kontak -->
      <div v-for="(contact, index) in contacts" :key="index"
           class="flex items-center justify-between gap-2 p-2 hover:bg-green-100 border rounded mb-1 cursor-pointer">
        
        <!-- Kiri: Avatar + Info -->
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-gray-400 rounded-full"></div>
          <div class="text-left">
            <p class="text-sm font-bold text-black">Customer {{ contact.id }}</p>
            <p class="text-xs text-gray-500 truncate">Halo Perkenalkan saya pelanggan {{ contact.id }}</p>
          </div>
        </div>
  
        <!-- Kanan: Tombol Delete -->
        <button @click="deleteContact(index)" class="text-red-500 hover:text-red-700">
          🗑️
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const contacts = ref([
    { id: 1 }, { id: 2 }, { id: 3 },
    { id: 4 }, { id: 5 }, { id: 6 }
  ])
  
  const deleteContact = (index) => {
    contacts.value.splice(index, 1)
  }
  </script>
  