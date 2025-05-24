require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { client } = require('./config/webwhatsapp.js');

const { IgApiClient } = require('instagram-private-api');
const { Telegraf } = require('telegraf');

// Import Controller
const {
    companyPhone,
    conversation,
    saveConversation,
    sendMessage,
    getReceivedMessages,
    newMessage,
    messages,
    getAllUsers,
} = require('./src/controller/ChatController.js');

// Import Model
const User = require('./src/models/User.js');

// Inisialisasi Aplikasi
const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Mengaktifkan CORS
app.use(express.json()); // Parsing body JSON

// Koneksi ke MongoDB
mongoose
    .connect('mongodb://localhost:27017/chatvue', {})
    .then(() => console.log('Koneksi ke MongoDB berhasil'))
    .catch((err) => console.error('Gagal koneksi ke MongoDB:', err));

// API Routes

// Route untuk Pesan
app.post('/send-message', sendMessage); // Mengirim pesan
app.get('/receive-message', getReceivedMessages); // Menerima pesan masuk

app.get('/api/messages', messages); // Mendapatkan semua pesan
app.post('/api/messages', newMessage); // Menambahkan pesan baru

// Route untuk Pengguna
app.post('/api/users', getAllUsers);

// Route untuk Perusahaan dan Percakapan
app.post('/api/company-phones', companyPhone); // Menambahkan data telepon perusahaan
app.post('/api/conversations', conversation); // Menambahkan percakapan baru
app.get('/api/conversations', saveConversation); // Menyimpan percakapan

// Inisialisasi WhatsApp Client
client.initialize();

// ------------------------
// Setup Instagram Client
const ig = new IgApiClient();

async function loginInstagram() {
    try {
        ig.state.generateDevice(process.env.IG_USERNAME);
        await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        console.log('Instagram login berhasil');
    } catch (err) {
        console.error('Instagram login error:', err);
    }
}
loginInstagram();

// Contoh route Instagram: dapatkan profil user
app.get('/api/instagram/profile', async (req, res) => {
    try {
        const user = await ig.account.currentUser();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil profil Instagram' });
    }
});

// ------------------------
// Setup Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Halo! Saya bot helpdesk siap membantu.'));
bot.help((ctx) => ctx.reply('Kirim pesan apa saja, saya akan membalas.'));
bot.on('text', (ctx) => {
    ctx.reply(`Kamu berkata: ${ctx.message.text}`);
});

bot.launch().then(() => {
    console.log('Telegram bot berjalan...');
});

// Contoh route untuk kirim pesan Telegram via API
app.post('/api/telegram/send', async (req, res) => {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
        return res.status(400).json({ error: 'chatId dan message diperlukan' });
    }
    try {
        await bot.telegram.sendMessage(chatId, message);
        res.json({ status: 'Pesan Telegram terkirim' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengirim pesan Telegram' });
    }
});

// ------------------------

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
