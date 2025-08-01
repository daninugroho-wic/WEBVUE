const { client, sendWhatsAppMessage, getClientStatus } = require('../config/whatsapp');
const Message = require('../models/Message');
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

  if (!number || !message) {
    console.log('❌ Validation failed: missing number or message');
    return res.status(400).json({ 
      success: false, 
      error: "Nomor dan pesan diperlukan" 
    });
  }

  try {
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

// Ambil pesan berdasarkan sender
const getMessagesBySender = async (req, res) => {
  const { sender } = req.query;
  
  if (!sender) {
    return res.status(400).json({ 
      success: false, 
      error: "Parameter 'sender' wajib diisi" 
    });
  }

  try {
    // Cari conversation berdasarkan contact_id
    const conversation = await Conversation.findOne({
      platform: 'whatsapp',
      contact_id: sender
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
      platform: 'whatsapp'
    })
    .sort({ createdAt: 1 })
    .lean();

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      text: msg.text,
      status: msg.status,
      send_by: msg.send_by,
      created_at: msg.createdAt,
      timestamp: msg.createdAt,
      messageSource: msg.messageSource
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
      platform: 'whatsapp'
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

// Ambil daftar kontak dari conversations (menggantikan contacts)
const getConversations = async (req, res) => {
  const { platform = 'whatsapp' } = req.query;

  try {
    const conversations = await Conversation.find({ platform })
      .sort({ last_message_time: -1 })
      .lean();

    const conversationsWithDetails = conversations.map(conv => ({
      _id: conv._id,
      whatsapp_id: conv.whatsapp_id,
      contact_id: conv.contact_id,
      contact_name: conv.contact_name,
      phone_number: conv.phone_number,
      last_message: conv.last_message || 'Tidak ada pesan',
      last_message_time: conv.last_message_time || conv.createdAt,
      unread_count: conv.unread_count || 0,
      is_blocked: conv.is_blocked || false,
      profile_pic_url: conv.profile_pic_url
    }));

    console.log(`📋 Retrieved ${conversationsWithDetails.length} ${platform} conversations`);

    res.json({ 
      success: true, 
      conversations: conversationsWithDetails 
    });

  } catch (error) {
    handleError(res, error, "Gagal mengambil daftar percakapan");
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

// Simpan conversation baru (menggantikan saveContact)
const saveConversation = async (req, res) => {
  const { platform, contact_id, contact_name, whatsapp_id, phone_number } = req.body;

  if (!platform || !contact_id) {
    return res.status(400).json({ 
      success: false, 
      error: "Platform dan contact_id diperlukan" 
    });
  }

  try {
    // Cek apakah conversation sudah ada
    const existingConversation = await Conversation.findOne({ 
      platform, 
      contact_id 
    });

    if (existingConversation) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation sudah ada" 
      });
    }

    // Buat conversation baru
    const newConversation = new Conversation({
      platform,
      contact_id,
      contact_name: contact_name || contact_id.replace('@c.us', ''),
      whatsapp_id: platform === 'whatsapp' ? (whatsapp_id || contact_id) : undefined,
      phone_number: platform === 'whatsapp' ? (phone_number || contact_id.replace('@c.us', '')) : undefined,
      last_message_time: new Date()
    });

    await newConversation.save();
    console.log('✅ Conversation baru disimpan:', contact_id);

    res.status(201).json({ 
      success: true, 
      conversation: newConversation 
    });

  } catch (error) {
    handleError(res, error, "Gagal menyimpan conversation");
  }
};

// Mark conversation as read
const markAsRead = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { unread_count: 0 },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation tidak ditemukan"
      });
    }

    console.log('✅ Conversation marked as read:', conversationId);

    res.json({
      success: true,
      message: "Conversation ditandai sudah dibaca"
    });

  } catch (error) {
    handleError(res, error, "Gagal menandai conversation sebagai dibaca");
  }
};

module.exports = {
  sendMessage,
  getMessagesBySender,
  getReceivedMessages,
  getConversations,
  saveConversation,
  getWhatsAppStatus,
  markAsRead
};