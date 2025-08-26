const { IgApiClient } = require('instagram-private-api');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let ig = null;
let loggedIn = false;
let currentUsername = null;
let dmListenerInterval = null;

// TAMBAHAN: Track pesan yang sudah diproses
const processedMessages = new Map(); // threadId -> lastMessageTimestamp

// ==================== MESSAGE HANDLERS ====================

// Handle pesan DM masuk
async function handleIncomingDM(thread) {
  try {
    if (!thread.last_permanent_item?.text) return;

    const threadId = thread.thread_id;
    const senderId = thread.users[0]?.pk?.toString();
    const senderName = thread.users[0]?.username || senderId;
    const messageText = thread.last_permanent_item.text;
    const messageTimestamp = thread.last_permanent_item.timestamp;

    // PERBAIKAN: Skip jika pesan sudah diproses
    const lastProcessedTimestamp = processedMessages.get(threadId);
    if (lastProcessedTimestamp && messageTimestamp <= lastProcessedTimestamp) {
      return; // Pesan sudah diproses sebelumnya
    }

    // PERBAIKAN: Skip jika pesan dari diri sendiri
    if (senderId === currentUsername || thread.last_permanent_item.user_id?.toString() === currentUsername) {
      processedMessages.set(threadId, messageTimestamp);
      return;
    }

    console.log('📨 Instagram DM masuk dari:', senderName);
    console.log('💬 Isi pesan:', messageText);
    console.log('🕐 Timestamp:', new Date(messageTimestamp * 1000));

    // Update processed messages tracker
    processedMessages.set(threadId, messageTimestamp);

    // Cek apakah pesan sudah ada di database
    const existingMessage = await Message.findOne({
      platform: 'instagram',
      sender_id: senderId,
      text: messageText,
      createdAt: { $gte: new Date(Date.now() - 60000) } // 1 menit terakhir
    });

    if (existingMessage) {
      console.log('⚠️ Pesan sudah ada di database, skip...');
      return;
    }

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

    // PERBAIKAN: Pastikan userId dalam format yang benar
    const userPk = typeof userId === 'string' ? userId : userId.toString();
    
    // Kirim DM
    const thread = ig.entity.directThread([userPk]);
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

    return { success: true, message_id: newMessage._id };

  } catch (error) {
    console.error('❌ Error mengirim DM Instagram:', error);
    return { success: false, error: error.message };
  }
}

// ==================== LOGIN & AUTHENTICATION ====================

const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

// Login Instagram
async function loginInstagram(username = IG_USERNAME, password = IG_PASSWORD) {
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

    // PERBAIKAN: Clear processed messages saat login ulang
    processedMessages.clear();

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
  if (dmListenerInterval) clearInterval(dmListenerInterval);

  console.log('🔄 Memulai monitoring DM Instagram...');
  
  // PERBAIKAN: Inisialisasi dengan thread yang sudah ada
  initializeProcessedMessages();
  
  dmListenerInterval = setInterval(async () => {
    try {
      const inbox = await ig.feed.directInbox().items();
      
      // Process setiap thread
      for (const thread of inbox) {
        await handleIncomingDM(thread);
      }

    } catch (error) {
      if (error.name === 'IgCheckpointError') {
        console.error('🔐 Challenge required saat check DM');
      } else {
        console.error('❌ Error checking Instagram DM:', error.message);
      }
    }
  }, 15000); // PERBAIKAN: Increase interval to 15 seconds
}

// TAMBAHAN: Initialize processed messages untuk thread yang sudah ada
async function initializeProcessedMessages() {
  try {
    const inbox = await ig.feed.directInbox().items();
    
    for (const thread of inbox) {
      if (thread.last_permanent_item?.timestamp) {
        processedMessages.set(thread.thread_id, thread.last_permanent_item.timestamp);
      }
    }
    
    console.log(`📋 Initialized ${processedMessages.size} processed message timestamps`);
  } catch (error) {
    console.error('❌ Error initializing processed messages:', error);
  }
}

// ==================== STATUS & UTILITY ====================

// Get Instagram status
function getInstagramStatus() {
  return {
    isLoggedIn: loggedIn,
    username: currentUsername,
    isReady: ig !== null,
    processedThreads: processedMessages.size
  };
}

// Logout Instagram
function logoutInstagram() {
  loggedIn = false;
  currentUsername = null;
  ig = null;
  if (dmListenerInterval) clearInterval(dmListenerInterval);
  dmListenerInterval = null;
  
  // PERBAIKAN: Clear processed messages saat logout
  processedMessages.clear();
  
  console.log('🛑 Instagram logout');
}

// ==================== EXPORTS ====================
module.exports = {
  loginInstagram,
  sendInstagramDM,
  getInstagramStatus,
  logoutInstagram,
  startDMListener
};