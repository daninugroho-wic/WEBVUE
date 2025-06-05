const { client } = require('../../config/whatsapp.js');
const Message = require('../models/Message.js');
const Contact = require('../models/Contact.js');
const Conversation = require('../models/Conversation.js');
const CompanyPhone = require('../models/CompanyPhone.js');
const User = require('../models/User.js');

// Helper function untuk menangani kesalahan
const handleError = (res, error, customMessage = 'Terjadi kesalahan') => {
  console.error(error);
  res.status(500).json({ success: false, message: customMessage, error: error.message });
};

// Helper function untuk mengirim pesan via WhatsApp
const sendMessageToWhatsApp = async (phoneNumber, message) => {
  if (!client || !client.isReady) {
    throw new Error("WhatsApp client belum siap");
  }
  await client.sendMessage(phoneNumber, message);
};

// Function untuk mengirim pesan
const sendMessage = async (req, res) => {
  const { number, message, conversationId, send_by = 'system' } = req.body;

  // Validasi input
  if (!number || !message) {
    return res.status(400).json({ success: false, error: "Nomor dan pesan diperlukan" });
  }

  const phoneNumber = number.startsWith('+') ? number : `+${number}`;
  const chatId = `${phoneNumber}@c.us`;

  try {
    // Tentukan nomor tujuan
    let targetPhoneNumber = phoneNumber;

    if (conversationId) {
      const conversation = await Conversation.findOne({ _id: conversationId });
      if (!conversation) {
        return res.status(404).json({ success: false, error: "Percakapan tidak ditemukan" });
      }
      targetPhoneNumber = conversation.phone_number;
    }

    // Kirim pesan melalui WhatsApp
    console.log(`Mengirim pesan ke ${targetPhoneNumber}: ${message}`);
    await sendMessageToWhatsApp(targetPhoneNumber, message);

    // Simpan pesan ke database
    const newMessage = new Message({
      conversationId,
      phone_number: targetPhoneNumber,
      message,
      send_by
    });
    await newMessage.save();

    // Respons pengiriman pesan sukses
    console.log(`Pesan berhasil dikirim ke ${targetPhoneNumber}: ${message}`);
    return res.status(200).json({ success: true, message: "Pesan berhasil dikirim" });
  } catch (error) {
    handleError(res, error, "Terjadi kesalahan saat mengirim pesan");
  }
};

// Simpan pesan baru ke DB (umum)
const newMessage = async (req, res) => {
  try {
    const { conversationId, text, chatId } = req.body;
    const newMessage = new Message({
      conversation_id: conversationId,
      text,
      sender_id: chatId,
      receiver_id: 'system', // atau 'admin' tergantung implementasi
      status: 'received',
      send_by: 'user', 
      timestamp: Date.now(),
    });

    await newMessage.save();
    res.status(201).json({ success: true, message: "Pesan baru berhasil disimpan" });
  } catch (err) {
    handleError(res, err, 'Error menyimpan pesan');
  }
};

// Ambil semua pesan (urut naik berdasarkan waktu)
const messages = async (req, res) => {
  try {
    const allMessages = await Message.find().sort({ timestamp: 1 });
    res.json({ success: true, messages: allMessages });
  } catch (err) {
    handleError(res, err, "Gagal mengambil pesan");
  }
};

// Ambil pesan masuk yang belum diambil
const getReceivedMessages = async (req, res) => {
  try {
    const messagesToSend = await Message.find({ status: 'received' }).sort({ timestamp: 1 });
    res.json({
      success: true,
      messages: messagesToSend.map(msg => ({
        sender_id: msg.sender_id,
        text: msg.text,
        date: new Date(msg.timestamp).toLocaleDateString(),
        time: new Date(msg.timestamp).toLocaleTimeString(),
        status: 'received',
      })),
    });
  } catch (err) {
    handleError(res, err, "Gagal mengambil pesan masuk");
  }
};

// Ambil semua percakapan unik dan pesan terakhirnya
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
    handleError(res, error, "Gagal mengambil percakapan");
  }
};

// Ambil pesan berdasarkan sender tertentu
const getMessagesBySender = async (req, res) => {
  const { sender } = req.query;
  if (!sender) return res.status(400).json({ success: false, error: "Parameter 'sender' wajib diisi" });

  try {
    const messages = await Message.find({ sender_id: sender }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    handleError(res, error, "Gagal mengambil pesan berdasarkan sender");
  }
};

// Ambil daftar kontak yang tersimpan
const contacts = async (req, res) => {
  try {
    const contacts = await Contact.find().lean();
    const results = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await Message.findOne({ sender_id: contact.whatsappId })
          .sort({ timestamp: -1 })
          .lean();
        return {
          ...contact,
          lastMessage: lastMessage ? lastMessage.text : 'Tidak ada pesan',
          lastTimestamp: lastMessage ? lastMessage.timestamp : null,
        };
      })
    );
    res.json({ success: true, contacts: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengambil kontak' });
  }
};

const saveContact = async (req, res) => {
  const { whatsappId, name, phoneNumber, profilePicUrl } = req.body;
  try {
    // Cek apakah kontak sudah ada
    const existingContact = await Contact.findOne({ whatsappId });
    if (existingContact) {
      return res.status(400).json({ success: false, message: "Kontak sudah ada" });
    }
    const newContact = new Contact({
      whatsappId,
      name,
      phoneNumber,
      profilePicUrl,
    });
    await newContact.save();
    res.status(201).json({ success: true, contact: newContact });
  } catch (error) {
    handleError(res, error, "Gagal menyimpan kontak");
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
    handleError(res, err, "Gagal menambah nomor perusahaan");
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
    handleError(res, err, "Gagal membuat percakapan baru");
  }
};

// Ambil semua percakapan
const saveConversation = async (req, res) => {
  try {
    const conversations = await Conversation.find();
    res.status(200).json({ success: true, conversations });
  } catch (err) {
    handleError(res, err, "Gagal mengambil percakapan");
  }
};

// Ambil semua pengguna
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (err) {
    handleError(res, err, "Gagal mengambil pengguna");
  }
};

module.exports = {
  contacts,
  saveContact,
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
