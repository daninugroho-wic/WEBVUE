const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { client } = require('./config/webwhatsapp.js');

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

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});