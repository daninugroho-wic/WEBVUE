require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { initializeWhatsApp, whatsappEvents } = require('./config/whatsapp');
const instagramService = require('./config/instagram');
const telegramService = require('./config/telegram');

const {
  companyPhone,
  conversation,
  saveConversation,
  sendMessage,
  getReceivedMessages,
  newMessage,
  messages,
  getAllUsers,
} = require('./src/controller/ChatController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Frontend connected via socket:', socket.id);
});

// Fungsi untuk emit pesan baru ke semua client terhubung
function emitNewMessage(message) {
  io.emit('new-message', message);
}

// Listen event dari whatsappEvents dan emit via socket.io
whatsappEvents.on('new-message', (message) => {
  console.log('Pesan baru dari WhatsApp, kirim ke frontend:', message);
  emitNewMessage(message);
});

// Koneksi MongoDB dan mulai server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatvue', {})
  .then(() => {
    console.log('Koneksi ke MongoDB berhasil');

    // Mulai WhatsApp client
    initializeWhatsApp();

    // Mulai Instagram login
    instagramService.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
      .then(result => {
        if (result.success) console.log('Instagram siap untuk menerima DM.');
      })
      .catch(err => console.error('Login Instagram gagal:', err));

    // Mulai Telegram Bot
    telegramService.startBot();

    // API routes
    app.post('/send-message', sendMessage);
    app.get('/receive-message', getReceivedMessages);
    app.get('/api/messages', messages);
    app.post('/api/messages', newMessage);
    app.post('/api/users', getAllUsers);
    app.post('/api/company-phones', companyPhone);
    app.post('/api/conversations', conversation);
    app.get('/api/conversations', saveConversation);

    // Telegram send message
    app.post('/api/telegram/send', async (req, res) => {
      const { chatId, message } = req.body;
      if (!chatId || !message) return res.status(400).json({ error: 'chatId dan message diperlukan' });
      try {
        await telegramService.sendMessage(chatId, message);
        res.json({ status: 'Pesan Telegram terkirim' });
      } catch (err) {
        res.status(500).json({ error: 'Gagal mengirim pesan Telegram' });
      }
    });

    server.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('Gagal koneksi ke MongoDB:', err));
