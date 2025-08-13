const { IgApiClient } = require('instagram-private-api');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let ig = null;
let loggedIn = false;
let currentUsername = null;

// ==================== MESSAGE HANDLERS ====================

// Handle pesan DM masuk
async function handleIncomingDM(thread) {
  try {
    if (!thread.last_permanent_item?.text) return;

    const senderId = thread.users[0]?.pk?.toString();
    const senderName = thread.users[0]?.username || senderId;
    const messageText = thread.last_permanent_item.text;

    console.log('📨 Instagram DM masuk dari:', senderName);
    console.log('💬 Isi pesan:', messageText);

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      platform: 'instagram',
      contact_id: senderId
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'instagram',
        contact_id: senderId,
        contact_name: senderName,
        instagram_id: senderId,
        last_message: messageText,
        last_message_time: new Date()
      });
      console.log('✅ Conversation Instagram baru dibuat');
    } else {
      conversation.contact_name = senderName;
      conversation.last_message = messageText;
      conversation.last_message_time = new Date();
    }

    await conversation.save();

    // Simpan pesan ke database
    const newMessage = new Message({
      platform: 'instagram',
      conversation_id: conversation._id,
      sender_id: senderId,
      receiver_id: currentUsername,
      text: messageText,
      status: 'received'
    });

    await newMessage.save();

    console.log('✅ Pesan Instagram disimpan ke database');

    // Emit real-time update (jika ada socket.io)
    if (global.io) {
      global.io.emit('new-instagram-message', {
        conversation_id: conversation._id,
        message_id: newMessage._id,
        sender_id: senderId,
        sender_name: senderName,
        text: messageText,
        timestamp: newMessage.createdAt,
        platform: 'instagram'
      });
    }

  } catch (error) {
    console.error('❌ Error handling Instagram DM:', error);
  }
}

// Kirim DM Instagram
async function sendInstagramDM(userId, messageText) {
  try {
    if (!loggedIn || !ig) {
      throw new Error('Instagram belum login');
    }

    console.log('📤 Mengirim DM Instagram ke:', userId);

    // Kirim DM
    const thread = ig.entity.directThread([userId]);
    await thread.broadcastText(messageText);

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      platform: 'instagram',
      contact_id: userId
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'instagram',
        contact_id: userId,
        contact_name: userId,
        instagram_id: userId,
        last_message: messageText,
        last_message_time: new Date()
      });
      await conversation.save();
    }

    // Simpan pesan yang dikirim
    const newMessage = new Message({
      platform: 'instagram',
      conversation_id: conversation._id,
      sender_id: currentUsername,
      receiver_id: userId,
      text: messageText,
      status: 'sent'
    });

    await newMessage.save();

    // Update conversation
    conversation.last_message = messageText;
    conversation.last_message_time = new Date();
    await conversation.save();

    console.log('✅ DM Instagram terkirim dan disimpan');

    // Emit real-time update
    if (global.io) {
      global.io.emit('instagram-message-sent', {
        conversation_id: conversation._id,
        message_id: newMessage._id,
        sender_id: currentUsername,
        receiver_id: userId,
        text: messageText,
        timestamp: newMessage.createdAt,
        platform: 'instagram'
      });
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error mengirim DM Instagram:', error);
    throw error;
  }
}

// ==================== LOGIN & AUTHENTICATION ====================

// Login Instagram
async function loginInstagram(username, password) {
  try {
    console.log('🔄 Login Instagram:', username);

    // Initialize Instagram API client
    ig = new IgApiClient();
    ig.state.generateDevice(username);

    // Login
    await ig.account.login(username, password);
    
    loggedIn = true;
    currentUsername = username;

    console.log('✅ Instagram login berhasil');

    // Start checking DMs
    startDMListener();

    return { success: true };

  } catch (error) {
    loggedIn = false;
    
    // Handle challenge (2FA)
    if (error.name === 'IgCheckpointError') {
      console.log('🔐 Instagram Challenge Required');
      return { 
        success: false, 
        challenge: true,
        challengeData: error.response.body.challenge 
      };
    }

    console.error('❌ Instagram login gagal:', error.message);
    throw error;
  }
}

// ==================== DM MONITORING ====================

// Start listening untuk DM baru
function startDMListener() {
  if (!loggedIn) return;

  console.log('🔄 Memulai monitoring DM Instagram...');

  // Check DMs setiap 10 detik
  setInterval(async () => {
    try {
      const inbox = await ig.feed.directInbox().items();
      
      // Process setiap thread
      inbox.forEach(thread => {
        // Skip jika tidak ada pesan baru
        if (!thread.last_permanent_item?.text) return;
        
        // Process pesan masuk
        handleIncomingDM(thread);
      });

    } catch (error) {
      if (error.name === 'IgCheckpointError') {
        console.error('🔐 Challenge required saat check DM');
      } else {
        console.error('❌ Error checking Instagram DM:', error.message);
      }
    }
  }, 10000); // 10 seconds interval
}

// ==================== STATUS & UTILITY ====================

// Get Instagram status
function getInstagramStatus() {
  return {
    isLoggedIn: loggedIn,
    username: currentUsername,
    isReady: ig !== null
  };
}

// Logout Instagram
function logoutInstagram() {
  loggedIn = false;
  currentUsername = null;
  ig = null;
  console.log('🛑 Instagram logout');
}

// ==================== EXPORTS ====================
module.exports = {
  loginInstagram,
  sendInstagramDM,
  getInstagramStatus,
  logoutInstagram
};