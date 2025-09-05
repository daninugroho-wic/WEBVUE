const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const WhatsAppSession = require('../models/WhatsAppSession');
const MAX_RESTART_ATTEMPTS = 5;
const RECONNECT_DELAY = 10000; 
const RESTART_DELAY = 5000;   
let restartAttempts = 0;
let isRestarting = false;
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
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    timeout: 120000,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false
  },
});

// ==================== CLIENT ====================

async function restartClient() {
  if (isRestarting || restartAttempts >= MAX_RESTART_ATTEMPTS) {
    return;
  }

  isRestarting = true;
  restartAttempts++;

  try {
    if (client) {
      await client.destroy();
    }
    
    await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
    
    await client.initialize();
    
  } catch (error) {
    setTimeout(() => {
      isRestarting = false;
      restartClient();
    }, RESTART_DELAY);
  }
}

function getClientStatus() {
  return {
    isReady: client?.info !== undefined && client.pupPage && !client.pupPage.isClosed(),
    isAuthenticated: client?.info !== null,
    phoneNumber: client?.info?.wid?._serialized || null,
    restartAttempts
  };
}

// ==================== SESSION ====================

async function ensureDefaultWhatsAppSession() {
  try {
    if (!client?.info?.wid) {
      return;
    }

    const phoneNumber = client.info.wid._serialized.replace('@c.us', '');
    const existingSession = await WhatsAppSession.findOne({ phone_number: phoneNumber });
    
    if (existingSession) {
      return existingSession;
    }

    const newSession = new WhatsAppSession({
      phone_number: phoneNumber,
      description: "Default WhatsApp Phone",
    });
    
    await newSession.save();
    return newSession;
    
  } catch (error) {
    return null;
  }
}

// ==================== MESSAGE HANDLING ====================

async function handleIncomingMessage(message) {
  if (!message?.body || !client?.info?.wid) {
    return;
  }
  
  if (message.from === client.info.wid._serialized) {
    return;
  }
  
  try {
    const contactInfo = await client.getContactById(message.from);
    
    let conversation = await Conversation.findOne({
      platform: 'whatsapp',
      contact_id: message.from
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'whatsapp',
        contact_id: message.from,
        contact_name: contactInfo.name || contactInfo.pushname || message.from.replace('@c.us', ''),
        whatsapp_id: message.from,
        last_message: message.body,
        last_message_time: new Date()
      });
    } else {
      conversation.contact_name = contactInfo.name || contactInfo.pushname || conversation.contact_name;
      conversation.last_message = message.body;
      conversation.last_message_time = new Date();
    }

    await conversation.save();

    const newMessage = new Message({
      conversation_id: conversation._id,
      text: message.body,
      sender_id: message.from,
      receiver_id: client.info.wid._serialized,
      status: 'received',
      platform: 'whatsapp',
      send_by: 'user'
    });

    await newMessage.save();

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
    if (!error.message.includes('Execution context was destroyed')) {
      console.error('❌ Error handling incoming message:', error.message);
    }
  }
}

async function sendWhatsAppMessage(phoneNumber, messageText, userId = 'system') {
  try {
    if (!client?.info) {
      throw new Error('WhatsApp client is not ready');
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    const sentMessage = await client.sendMessage(formattedNumber, messageText);
    
    let conversation = await Conversation.findOne({
      platform: 'whatsapp',
      contact_id: formattedNumber
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'whatsapp',
        contact_id: formattedNumber,
        contact_name: formattedNumber.replace('@c.us', ''),
        whatsapp_id: formattedNumber,
        last_message: messageText,
        last_message_time: new Date()
      });
    } else {
      conversation.last_message = messageText;
      conversation.last_message_time = new Date();
    }

    await conversation.save();
    
    const newMessage = new Message({
      conversation_id: conversation._id,
      text: messageText,
      sender_id: client.info.wid._serialized,
      receiver_id: formattedNumber,
      status: 'sent',
      platform: 'whatsapp',
      send_by: userId === 'system' ? 'system' : 'user'
    });

    await newMessage.save();

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: new Date()
    };

  } catch (error) {
    throw error;
  }
}

function formatPhoneNumber(phoneNumber) {
  if (phoneNumber.includes('@c.us')) {
    return phoneNumber;
  }
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return `${cleanNumber}@c.us`;
}

// ==================== CLIENT EVENT HANDLERS ====================

function initializeWhatsApp() {
  client.on('qr', (qr) => {
    console.log('📱 Scan QR Code:');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated successfully');
    restartAttempts = 0;
    isRestarting = false;
    
    setTimeout(() => {
      if (!client.info) {
        if (!isRestarting) {
          restartClient();
        }
      }
    }, 180000);
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp Client is ready!');
    isRestarting = false;
    
    setTimeout(async () => {
      await ensureDefaultWhatsAppSession();
    }, 2000);
  });

  client.on('message', handleIncomingMessage);

  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed');
    isRestarting = false;
    
    setTimeout(() => {
      restartClient();
    }, RESTART_DELAY);
  });

  client.on('disconnected', (reason) => {
    console.log('🔌 Client disconnected');
    isRestarting = false;
    
    if (restartAttempts < MAX_RESTART_ATTEMPTS) {
      setTimeout(() => {
        restartClient();
      }, RECONNECT_DELAY);
    }
  });

  client.on('error', (error) => {
    if (error.message.includes('Session closed') || 
        error.message.includes('Protocol error')) {
      if (!isRestarting) {
        restartClient();
      }
    }
  });

  client.initialize();
}

module.exports = { 
  client, 
  initializeWhatsApp, 
  whatsappEvents, 
  sendWhatsAppMessage,
  getClientStatus
};