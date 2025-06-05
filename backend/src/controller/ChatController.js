const { client } = require('../../config/whatsapp.js');
const Message = require('../models/Message.js');
const Conversation = require('../models/Conversation.js');
const CompanyPhone = require('../models/CompanyPhone.js');
const User = require('../models/User.js');

// Kirim pesan WA dan simpan ke DB
const sendMessage = async (req, res) => {
  const { number, message, conversationId, send_by = 'system' } = req.body;
  const chatId = `${number}@c.us`;

  try {
    await client.sendMessage(chatId, message);

    const newMessage = new Message({
      conversation_id: conversationId,
      text: message,
      sender_id: send_by || 'system',
      receiver_id: chatId,
      status: 'sent',
      send_by,
      timestamp: Date.now(),
    });
    await newMessage.save();

    res.status(200).json({ success: true, message: "Pesan terkirim dan disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Simpan pesan baru ke DB (umum)
const newMessage = async (req, res) => {
  try {
    const { conversation_id, text, sender_id, receiver_id, send_by } = req.body;

    const newMsg = new Message({
      conversation_id,
      text,
      sender_id,
      receiver_id,
      send_by: send_by || 'system',
      timestamp: Date.now(),
    });
    await newMsg.save();

    res.json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, error: "Gagal menyimpan pesan" });
  }
};

// Ambil semua pesan (urut naik berdasarkan waktu)
const messages = async (req, res) => {
  try {
    const allMessages = await Message.find().sort({ timestamp: 1 });
    res.json({ success: true, messages: allMessages });
  } catch (err) {
    res.status(500).json({ success: false, error: "Gagal mengambil pesan" });
  }
};

// Ambil pesan masuk yang belum diambil (dari array receivedMessage)
const getReceivedMessages = (req, res) => {
  try {
    const messagesToSend = [...receivedMessage];
    receivedMessage.length = 0;

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

// Ambil semua percakapan unik dan pesan terakhirnya (untuk daftar kontak)
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().lean();

    const results = await Promise.all(conversations.map(async (conv) => {
      const lastMsg = await Message.findOne({ conversation_id: conv._id }).sort({ timestamp: -1 }).lean();
      return {
        id: conv._id,
        contactNumber: conv.sender,
        lastMessage: lastMsg ? lastMsg.text : '',
        lastTimestamp: lastMsg ? lastMsg.timestamp : null,
      };
    }));

    results.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

    res.json({ success: true, conversations: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil conversations', error });
  }
};

// Ambil pesan berdasarkan sender tertentu (chat per kontak)
const getMessagesBySender = async (req, res) => {
  try {
    const sender = req.query.sender;
    if (!sender) {
      return res.status(400).json({ success: false, error: "Parameter 'sender' wajib diisi" });
    }

    const messages = await Message.find({ sender_id: sender }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengambil pesan berdasarkan sender' });
  }
};

// Tambah nomor perusahaan
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

// Buat percakapan baru
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

// Ambil semua percakapan
const saveConversation = async (req, res) => {
  try {
    const conversations = await Conversation.find();
    res.status(200).json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: "Gagal mengambil percakapan" });
  }
};

// Ambil semua pengguna (disini saya perbaiki supaya hanya mengambil, bukan buat user baru)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  sendMessage,
  getReceivedMessages,
  companyPhone,
  conversation,
  saveConversation,
  getAllUsers,
  newMessage,
  messages,
  getConversations,
  getMessagesBySender,
};
