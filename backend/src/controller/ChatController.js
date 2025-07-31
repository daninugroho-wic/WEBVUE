const { client, sendWhatsAppMessage, getClientStatus } = require('../config/whatsapp');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Conversation = require('../models/Conversation');
const CompanyPhone = require('../models/CompanyPhone');

// Helper function untuk menangani kesalahan
const handleError = (res, error, customMessage = 'Terjadi kesalahan') => {
  console.error('❌', customMessage, ':', error);
  res.status(500).json({ 
    success: false, 
    message: customMessage, 
    error: error.message 
  });
};

// Function untuk mengirim pesan yang disempurnakan
const sendMessage = async (req, res) => {
  const { number, message, sender_id = 'user_3' } = req.body;

  console.log('📤 Incoming send message request:', {
    number,
    message: message?.substring(0, 50) + '...',
    sender_id,
    body: req.body
  });

  // Validasi input
  if (!number || !message) {
    console.log('❌ Validation failed: missing number or message');
    return res.status(400).json({ 
      success: false, 
      error: "Nomor dan pesan diperlukan" 
    });
  }

  try {
    // Cek status WhatsApp client
    const status = getClientStatus();
    console.log('📱 WhatsApp client status:', status);
    
    if (!status.isReady) {
      console.log('❌ WhatsApp client not ready');
      return res.status(503).json({
        success: false,
        error: "WhatsApp client belum siap"
      });
    }

    console.log('📤 Attempting to send message via WhatsApp...');

    // Kirim pesan menggunakan fungsi yang sudah disempurnakan
    const result = await sendWhatsAppMessage(number, message, sender_id);

    console.log('✅ Message send result:', result);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Pesan berhasil dikirim",
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      throw new Error(result.error || 'Gagal mengirim pesan');
    }

  } catch (error) {
    console.error('❌ Send message error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengirim pesan WhatsApp", 
      error: error.message 
    });
  }
};

// Ambil pesan berdasarkan sender dengan filtering yang lebih baik
const getMessagesBySender = async (req, res) => {
  const { sender } = req.query;
  
  if (!sender) {
    return res.status(400).json({ 
      success: false, 
      error: "Parameter 'sender' wajib diisi" 
    });
  }

  try {
    // Cari conversation berdasarkan sender
    const conversation = await Conversation.findOne({
      $or: [
        { sender: sender },
        { receiver: sender }
      ]
    });

    if (!conversation) {
      return res.json({ 
        success: true, 
        messages: [] 
      });
    }

    // Ambil semua pesan dalam conversation ini
    const messages = await Message.find({ 
      conversation_id: conversation._id,
      messageType: 'text' // Hanya pesan teks
    })
    .sort({ createdAt: 1 }) // Urutkan berdasarkan waktu
    .lean();

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      text: msg.text,
      status: msg.status,
      send_by: msg.send_by,
      created_at: msg.createdAt,
      timestamp: msg.createdAt
    }));

    console.log(`📋 Retrieved ${formattedMessages.length} messages for sender: ${sender}`);

    res.json({ 
      success: true, 
      messages: formattedMessages 
    });

  } catch (error) {
    handleError(res, error, "Gagal mengambil pesan berdasarkan sender");
  }
};

// Ambil semua pesan masuk yang belum dibaca
const getReceivedMessages = async (req, res) => {
  try {
    const messages = await Message.find({ 
      status: 'received',
      messageType: 'text'
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    const formattedMessages = messages.map(msg => ({
      message_id: msg._id,
      sender_id: msg.sender_id,
      text: msg.text,
      date: new Date(msg.createdAt).toLocaleDateString('id-ID'),
      time: new Date(msg.createdAt).toLocaleTimeString('id-ID'),
      status: 'received',
      timestamp: msg.createdAt
    }));

    res.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    handleError(res, error, "Gagal mengambil pesan masuk");
  }
};

// Ambil daftar kontak dengan pesan terakhir
const contacts = async (req, res) => {
  try {
    // Ambil semua conversation yang unik
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .lean();

    const contactsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        // Ambil pesan terakhir dari conversation ini
        const lastMessage = await Message.findOne({ 
          conversation_id: conv._id,
          messageType: 'text'
        })
        .sort({ createdAt: -1 })
        .lean();

        // Ambil info kontak jika ada
        const contactInfo = await Contact.findOne({ 
          whatsappId: conv.sender 
        }).lean();

        return {
          whatsappId: conv.sender,
          contactNumber: conv.sender,
          name: contactInfo?.name || conv.sender.replace('@c.us', ''),
          phoneNumber: conv.sender.replace('@c.us', ''),
          lastMessage: lastMessage ? lastMessage.text : 'Tidak ada pesan',
          lastTimestamp: lastMessage ? lastMessage.createdAt : conv.createdAt,
          isBlocked: contactInfo?.isBlocked || false
        };
      })
    );

    // Urutkan berdasarkan pesan terakhir
    contactsWithMessages.sort((a, b) => 
      new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
    );

    console.log(`📋 Retrieved ${contactsWithMessages.length} contacts`);

    res.json({ 
      success: true, 
      contacts: contactsWithMessages 
    });

  } catch (error) {
    handleError(res, error, "Gagal mengambil daftar kontak");
  }
};

// Get WhatsApp client status
const getWhatsAppStatus = async (req, res) => {
  try {
    const status = getClientStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    handleError(res, error, "Gagal mendapatkan status WhatsApp");
  }
};

// Simpan kontak baru
const saveContact = async (req, res) => {
  const { whatsappId, name, phoneNumber } = req.body;

  if (!whatsappId) {
    return res.status(400).json({ 
      success: false, 
      error: "WhatsApp ID diperlukan" 
    });
  }

  try {
    // Cek apakah kontak sudah ada
    const existingContact = await Contact.findOne({ whatsappId });
    if (existingContact) {
      return res.status(400).json({ 
        success: false, 
        message: "Kontak sudah ada" 
      });
    }

    // Buat kontak baru
    const newContact = new Contact({
      whatsappId,
      name: name || whatsappId.replace('@c.us', ''),
      phoneNumber: phoneNumber || whatsappId.replace('@c.us', ''),
      lastSeen: new Date()
    });

    await newContact.save();
    console.log('✅ Kontak baru disimpan:', whatsappId);

    res.status(201).json({ 
      success: true, 
      contact: newContact 
    });

  } catch (error) {
    handleError(res, error, "Gagal menyimpan kontak");
  }
};

module.exports = {
  sendMessage,
  getMessagesBySender,
  getReceivedMessages,
  contacts,
  saveContact,
  getWhatsAppStatus
};