const { IgApiClient } = require('instagram-private-api');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let ig = null;
let loggedIn = false;
let currentUsername = null;
let dmListenerInterval = null;

// ✅ FIXED: Better tracking untuk prevent duplicates
const processedMessages = new Map(); // threadId -> Set of message IDs
const processingLock = new Set(); // Prevent race conditions

// ==================== MESSAGE HANDLERS ====================

// Handle pesan DM masuk
async function handleIncomingDM(thread) {
  try {
    if (!thread.last_permanent_item?.text) return;

    const threadId = thread.thread_id;
    const messageId = thread.last_permanent_item.item_id; // ✅ Use unique message ID
    const senderId = thread.users[0]?.pk?.toString();
    const senderName = thread.users[0]?.username || senderId;
    const messageText = thread.last_permanent_item.text;

    // ✅ FIXED: Skip if already processing this exact message
    const lockKey = `${threadId}_${messageId}`;
    if (processingLock.has(lockKey)) return;

    // ✅ FIXED: Check if message already processed using message ID
    const threadMessages = processedMessages.get(threadId) || new Set();
    if (threadMessages.has(messageId)) return;

    // ✅ FIXED: Skip self messages
    if (senderId === currentUsername || thread.last_permanent_item.user_id?.toString() === currentUsername) {
      threadMessages.add(messageId);
      processedMessages.set(threadId, threadMessages);
      return;
    }

    // ✅ FIXED: Add processing lock
    processingLock.add(lockKey);

    try {
      console.log('📨 Instagram DM masuk dari:', senderName);

      // ✅ FIXED: More robust duplicate check in database
      const existingMessage = await Message.findOne({
        platform: 'instagram',
        sender_id: senderId,
        text: messageText,
        createdAt: { $gte: new Date(Date.now() - 300000) } // 5 minutes window
      });

      if (existingMessage) {
        console.log('⚠️ Pesan sudah ada di database, skip...');
        threadMessages.add(messageId);
        processedMessages.set(threadId, threadMessages);
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

      // ✅ FIXED: Mark as processed after successful save
      threadMessages.add(messageId);
      processedMessages.set(threadId, threadMessages);

      console.log('✅ Pesan Instagram disimpan ke database');

      // Emit real-time update
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

    } finally {
      // ✅ FIXED: Always remove processing lock
      processingLock.delete(lockKey);
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

async function loginInstagram(username = IG_USERNAME, password = IG_PASSWORD) {
  try {
    console.log('🔄 Login Instagram:', username);

    ig = new IgApiClient();
    ig.state.generateDevice(username);
    await ig.account.login(username, password);
    
    loggedIn = true;
    currentUsername = username;

    console.log('✅ Instagram login berhasil');

    // ✅ FIXED: Clear all tracking on fresh login
    processedMessages.clear();
    processingLock.clear();

    startDMListener();
    return { success: true };

  } catch (error) {
    loggedIn = false;
    
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

function startDMListener() {
  if (!loggedIn) return;
  if (dmListenerInterval) clearInterval(dmListenerInterval);
  
  initializeProcessedMessages();
  
  // ✅ FIXED: Increased interval to reduce API calls and duplicates
  dmListenerInterval = setInterval(async () => {
    try {
      const inbox = await ig.feed.directInbox().items();
      
      // ✅ FIXED: Process threads sequentially to avoid race conditions
      for (const thread of inbox) {
        await handleIncomingDM(thread);
        // ✅ FIXED: Small delay between threads
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      if (error.name === 'IgCheckpointError') {
        console.error('🔐 Challenge required saat check DM');
      } else if (error.name === 'IgLoginRequiredError') {
        loggedIn = false;
        clearInterval(dmListenerInterval);
        dmListenerInterval = null;
      } else {
        console.error('❌ Error checking Instagram DM:', error.message);
      }
    }
  }, 30000); // ✅ FIXED: 30 seconds instead of 15
}

// ✅ FIXED: Better initialization
async function initializeProcessedMessages() {
  try {
    const inbox = await ig.feed.directInbox().items();
    
    for (const thread of inbox) {
      if (thread.last_permanent_item?.item_id) {
        const threadMessages = new Set();
        threadMessages.add(thread.last_permanent_item.item_id);
        processedMessages.set(thread.thread_id, threadMessages);
      }
    }
    
    console.log(`📋 Initialized ${processedMessages.size} processed message sets`);
  } catch (error) {
    console.error('❌ Error initializing processed messages:', error);
    
    // ✅ FIXED: Fallback to database if API fails
    try {
      const recentMessages = await Message.find({
        platform: 'instagram',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).select('sender_id text createdAt');

      // Create pseudo message IDs from recent messages
      for (const msg of recentMessages) {
        const pseudoId = `${msg.sender_id}_${msg.text.slice(0, 20)}_${msg.createdAt.getTime()}`;
        const threadMessages = processedMessages.get(msg.sender_id) || new Set();
        threadMessages.add(pseudoId);
        processedMessages.set(msg.sender_id, threadMessages);
      }

      console.log('✅ Fallback initialization from database completed');
    } catch (dbError) {
      console.error('❌ Database fallback failed:', dbError);
    }
  }
}

// ==================== STATUS & UTILITY ====================

function getInstagramStatus() {
  return {
    isLoggedIn: loggedIn,
    username: currentUsername,
    isReady: ig !== null,
    processedThreads: processedMessages.size,
    processingLocks: processingLock.size
  };
}

function logoutInstagram() {
  loggedIn = false;
  currentUsername = null;
  ig = null;
  if (dmListenerInterval) clearInterval(dmListenerInterval);
  dmListenerInterval = null;
  
  // ✅ FIXED: Clear all tracking data
  processedMessages.clear();
  processingLock.clear();
  
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