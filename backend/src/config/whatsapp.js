const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const WhatsAppSession = require('../models/WhatsAppSession');

// ==================== CONSTANTS ====================
const MAX_RESTART_ATTEMPTS = 5;
const RECONNECT_DELAY = 10000; // 10 seconds
const RESTART_DELAY = 5000;    // 5 seconds

// ==================== GLOBAL VARIABLES ====================
let restartAttempts = 0;

// ==================== EVENT EMITTER ====================
class WhatsappEmitter extends EventEmitter {}
const whatsappEvents = new WhatsappEmitter();

// ==================== CLIENT CONFIGURATION ====================
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-helpdesk"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection'
    ],
    timeout: 60000,
  },
});

// ==================== CLIENT MANAGEMENT ====================

/**
 * Restart WhatsApp client dengan retry logic
 */
async function restartClient() {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error(`❌ Batas maksimal restart (${MAX_RESTART_ATTEMPTS}x) tercapai. Butuh intervensi manual.`);
    return;
  }

  restartAttempts++;
  console.log(`🔄 Restart WhatsApp Client - Percobaan ${restartAttempts}/${MAX_RESTART_ATTEMPTS}`);

  try {
    await client.destroy();
    setTimeout(() => {
      console.log('🚀 Reinitializing WhatsApp client...');
      client.initialize();
    }, RESTART_DELAY);
  } catch (error) {
    console.error('❌ Gagal restart client:', error.message);
    setTimeout(restartClient, RECONNECT_DELAY);
  }
}

/**
 * Get current client status
 */
function getClientStatus() {
  return {
    isReady: client?.info !== undefined,
    isAuthenticated: client?.info !== null,
    phoneNumber: client?.info?.wid?._serialized || null,
    restartAttempts
  };
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Ensure default WhatsApp session exists in database
 */
async function ensureDefaultWhatsAppSession() {
  try {
    if (!client?.info?.wid) {
      console.warn('⚠️ Client info tidak tersedia, skip session creation');
      return;
    }

    const phoneNumber = client.info.wid._serialized.replace('@c.us', '');
    const existingSession = await WhatsAppSession.findOne({ phone_number: phoneNumber });
    
    if (existingSession) {
      console.log(`✅ WhatsApp session sudah ada: ${phoneNumber}`);
      return existingSession;
    }

    // Create new session
    const newSession = new WhatsAppSession({
      phone_number: phoneNumber,
      description: "Default WhatsApp Phone",
    });
    
    await newSession.save();
    console.log(`✅ WhatsApp session baru dibuat: ${phoneNumber}`);
    return newSession;
    
  } catch (error) {
    console.error('❌ Error creating WhatsApp session:', error.message);
    return null;
  }
}

// ==================== CONVERSATION MANAGEMENT ====================

/**
 * Save or update conversation data
 */
async function saveOrUpdateConversation(contactId, contactInfo = {}) {
  try {
    let conversation = await Conversation.findOne({ 
      platform: 'whatsapp',
      contact_id: contactId 
    });
    
    const phoneNumber = contactId.replace('@c.us', '');
    const contactName = contactInfo.name || contactInfo.pushname || phoneNumber;
    
    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        platform: 'whatsapp',
        contact_id: contactId,
        contact_name: contactName,
        whatsapp_id: contactId,
        phone_number: phoneNumber,
        profile_pic_url: contactInfo.profilePicUrl || null,
        last_message_time: new Date(),
        unread_count: 0
      });
      
      console.log(`✅ New conversation created: ${contactName} (${phoneNumber})`);
    } else {
      // Update existing conversation
      conversation.contact_name = contactName;
      conversation.last_message_time = new Date();
      
      console.log(`✅ Conversation updated: ${contactName} (${phoneNumber})`);
    }
    
    await conversation.save();
    return conversation;
    
  } catch (error) {
    console.error('❌ Error saving conversation:', error.message);
    return null;
  }
}

// ==================== MESSAGE HANDLING ====================

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(message) {
  // Validation checks
  if (!message?.body || !client?.info?.wid) {
    return;
  }
  
  // Skip messages from self
  if (message.from === client.info.wid._serialized) {
    return;
  }
  
  try {
    console.log(`📨 Incoming message from: ${message.from}`);
    console.log(`💬 Message: ${message.body}`);

    // Get contact information
    const contactInfo = await client.getContactById(message.from);
    
    // Save or update conversation
    const conversation = await saveOrUpdateConversation(message.from, {
      name: contactInfo.name,
      pushname: contactInfo.pushname
    });

    if (!conversation) {
      console.error('❌ Failed to create/update conversation');
      return;
    }

    // Save message to database
    const newMessage = new Message({
      conversation_id: conversation._id,
      text: message.body,
      sender_id: message.from,
      receiver_id: client.info.wid._serialized,
      status: 'received',
      platform: 'whatsapp',
      send_by: 'user',
    });

    await newMessage.save();
    
    // Update conversation last message
    conversation.last_message = message.body;
    conversation.last_message_time = new Date();
    conversation.unread_count = (conversation.unread_count || 0) + 1;
    await conversation.save();

    console.log('✅ Message saved to database successfully');

    // Emit real-time event
    const messageData = {
      message_id: newMessage._id.toString(),
      conversation_id: conversation._id.toString(),
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      sender_name: conversation.contact_name,
      text: newMessage.text,
      timestamp: newMessage.createdAt,
      platform: 'whatsapp',
      status: 'received'
    };

    whatsappEvents.emit('new-message', messageData);

  } catch (error) {
    if (error.message.includes('Execution context was destroyed')) {
      console.warn('⚠️ Context destroyed, skipping message');
    } else {
      console.error('❌ Error handling incoming message:', error.message);
    }
  }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(phoneNumber, messageText, userId = 'system') {
  try {
    // Validate client status
    if (!client?.info) {
      throw new Error('WhatsApp client is not ready');
    }

    // Format phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    console.log(`📤 Sending message to: ${formattedNumber}`);
    console.log(`💬 Message: ${messageText}`);

    // Send message via WhatsApp
    const sentMessage = await client.sendMessage(formattedNumber, messageText);
    
    // Find or create conversation
    const conversation = await findOrCreateConversation(formattedNumber);
    
    // Save sent message to database
    const newMessage = new Message({
      conversation_id: conversation._id,
      text: messageText,
      sender_id: client.info.wid._serialized,
      receiver_id: formattedNumber,
      status: 'sent',
      platform: 'whatsapp',
      send_by: userId === 'system' ? 'system' : 'user',
    });

    await newMessage.save();
    
    // Update conversation
    conversation.last_message = messageText;
    conversation.last_message_time = new Date();
    await conversation.save();

    console.log('✅ Message sent and saved successfully');

    // Emit real-time event
    const messageData = {
      message_id: newMessage._id.toString(),
      conversation_id: conversation._id.toString(),
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      text: newMessage.text,
      timestamp: newMessage.createdAt,
      platform: 'whatsapp',
      status: 'sent'
    };

    whatsappEvents.emit('message-sent', messageData);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format phone number to WhatsApp format
 */
function formatPhoneNumber(phoneNumber) {
  if (phoneNumber.includes('@c.us')) {
    return phoneNumber;
  }
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return `${cleanNumber}@c.us`;
}

/**
 * Find or create conversation for phone number
 */
async function findOrCreateConversation(formattedNumber) {
  let conversation = await Conversation.findOne({
    platform: 'whatsapp',
    contact_id: formattedNumber
  });

  if (!conversation) {
    const phoneNumber = formattedNumber.replace('@c.us', '');
    conversation = new Conversation({
      platform: 'whatsapp',
      contact_id: formattedNumber,
      contact_name: phoneNumber,
      whatsapp_id: formattedNumber,
      phone_number: phoneNumber,
      unread_count: 0
    });
    await conversation.save();
    console.log(`✅ New conversation created for: ${phoneNumber}`);
  }

  return conversation;
}

// ==================== CLIENT EVENT HANDLERS ====================

/**
 * Initialize WhatsApp client with event handlers
 */
function initializeWhatsApp() {
  console.log('🚀 Initializing WhatsApp Web Client...');

  // QR Code event
  client.on('qr', (qr) => {
    console.log('📱 QR Code generated - Scan with your WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log(`🔗 QR Code URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
  });

  // Authentication success
  client.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated successfully');
    restartAttempts = 0; // Reset restart attempts
  });

  // Client ready
  client.on('ready', async () => {
    console.log('✅ WhatsApp Client is ready!');
    console.log(`📱 Active number: ${client.info.wid._serialized}`);
    
    // Ensure session exists
    await ensureDefaultWhatsAppSession();
    
    console.log('🔄 WhatsApp connection test completed');
  });

  // Incoming messages
  client.on('message', handleIncomingMessage);

  // Outgoing messages (from web interface)
  client.on('message_create', (message) => {
    if (message.fromMe) {
      console.log(`📤 Message sent from web: ${message.body}`);
    }
  });

  // Authentication failure
  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    setTimeout(() => {
      console.log('🔄 Attempting client restart after auth failure...');
      restartClient();
    }, RESTART_DELAY);
  });

  // Client disconnected
  client.on('disconnected', (reason) => {
    console.warn('🔌 WhatsApp Client disconnected:', reason);
    setTimeout(() => {
      console.log('🔄 Attempting reconnection...');
      restartClient();
    }, RECONNECT_DELAY);
  });

  // General errors
  client.on('error', (error) => {
    console.error('❌ WhatsApp Client Error:', error.message);
  });

  // Start client
  client.initialize();
}

// ==================== EXPORTS ====================
module.exports = { 
  client, 
  initializeWhatsApp, 
  whatsappEvents, 
  sendWhatsAppMessage,
  getClientStatus
};