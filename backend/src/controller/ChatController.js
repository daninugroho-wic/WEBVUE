const { client, receivedMessage } = require('../../config/webwhatsapp.js');
const Message = require('../models/Message.js'); // Model untuk pesan
const Conversation = require('../models/Conversation.js'); // Model untuk percakapan
const CompanyPhone = require('../models/CompanyPhone.js'); // Model untuk nomor perusahaan
const User = require('../models/User.js'); // Model untuk pengguna

// _______________________________________________________ Fungsi MESSAGE.JS

// Mengirim pesan melalui WhatsApp dan menyimpannya ke database
const sendMessage = async (req, res) => {
    const { number, message, conversationId, send_by = 'system' } = req.body;
    const chatId = `${number}@c.us`; // Format WhatsApp ID

    try {
        // Kirim pesan ke WhatsApp
        await client.sendMessage(chatId, message);

        // Simpan pesan ke database
        const newMessage = new Message({
            conversation_id: conversationId,
            text: message, // Gunakan "text" konsisten
            sender_id: send_by || 'system', // Tambahkan sender_id
            receiver_id: chatId, // Tambahkan receiver_id
            status: 'sent',
            send_by,
        });
        await newMessage.save();
        console.log('Pesan terkirim dan disimpan:', newMessage);

        res.status(200).json({ success: true, message: "Pesan terkirim dan disimpan" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Menambahkan pesan baru ke database
const newMessage = async (req, res) => {
    try {
        const { conversation_id, text, sender_id, receiver_id, send_by } = req.body;

        const newMessage = new Message({
            conversation_id,
            text,
            sender_id,
            receiver_id,
            send_by: send_by || 'system',
        });
        await newMessage.save();
        res.json({ success: true, message: newMessage });
    } catch (err) {
        res.status(500).json({ success: false, error: "Gagal menyimpan pesan" });
    }
};

// Mengambil pesan dan mengembalikannya
const messages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ created_at: 1 }); // Perbaiki urutan berdasarkan created_at
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: "Gagal mengambil pesan" });
    }
};

// Mengambil pesan masuk yang diterima
const getReceivedMessages = (req, res) => {
    try {
        const messagesToSend = [...receivedMessage];

        receivedMessage.length = 0; // Kosongkan array setelah dikirim
        res.json({
            success: true,
            messages: messagesToSend.map(msg => ({
                sender_id: msg.from,
                text: msg.body,
                date: msg.date,
                time: msg.time,
                status: 'received',
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};








// _______________________________________________________ Fungsi COMPANYPHONE.JS

// Menambahkan nomor perusahaan ke database
const companyPhone = async (req, res) => {
    const { phone_number, description, name } = req.body;

    try {
        const phone = new CompanyPhone({ phone_number, description, name });
        await phone.save();
        res.status(201).json({ success: true, phone });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// _______________________________________________________ Fungsi CONVERSATION.JS

// Membuat percakapan baru
const conversation = async (req, res) => {
    const { sender, receiver } = req.body;

    try {
        const newConversation = new Conversation({ sender, receiver });
        await newConversation.save();
        res.status(201).json({ success: true, conversation: newConversation });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Mengambil semua percakapan
const saveConversation = async (req, res) => {
    try {
        const conversations = await Conversation.find();
        res.status(200).json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ success: false, error: "Gagal mengambil percakapan" });
    }
};

// _______________________________________________________ Fungsi USER.JS

// Mengambil semua pengguna
const getAllUsers = async (req, res) => {
    const { name, role } = req.body;

    try {
        const user = new User({ name, role });
        await user.save();
        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// Ekspor Modul

module.exports = {
    sendMessage,
    getReceivedMessages,
    companyPhone,
    conversation,
    saveConversation,
    getAllUsers,
    newMessage,
    messages,
};