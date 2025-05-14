<template>
    <div class="flex flex-col min-h-screen bg-gray-100">
      <header class="bg-blue-600 text-white p-4 shadow-md">
        <h1 class="text-xl font-bold">Chat Telegram</h1>
      </header>
  
      <main class="flex-grow p-4 overflow-y-auto bg-white">
          <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.sender === 'me' ? 'justify-end' : 'justify-start'">
            <div class="max-w-xs mt-1 p-3 rounded-lg text-white" 
                 :class="message.sender === 'me' ? 'bg-blue-500' : 'bg-gray-500'">
              {{ message.text }}
            </div>
          </div>
      </main>
  
      <footer class="bg-gray-800 p-4">
        <div class="container mx-auto flex gap-2">
          <input v-model="newMessage" type="text" placeholder="Ketik pesan..." 
                 class="flex-grow p-2 rounded-lg border border-gray-300 bg-white focus:outline-none">
          <button @click="sendMessage" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Kirim</button>
        </div>
      </footer>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        newMessage: "",
        messages: [
          { text: "Halo!", sender: "other" },
          { text: "Hai! Apa kabar?", sender: "me" }
        ]
      };
    },
    methods: {
      sendMessage() {
        if (this.newMessage.trim() !== "") {
          this.messages.push({ text: this.newMessage, sender: "me" });
          this.newMessage = "";
          setTimeout(() => {
            this.messages.push({ text: "Pesan diterima!", sender: "other" });
          }, 1000);
        }
      }
    }
  };
  </script>
  