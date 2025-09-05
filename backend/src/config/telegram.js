const { Telegraf } = require('telegraf');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let bot = null;
let botToken = null;

// ==================== MESSAGE HANDLERS ====================

// Handle pesan masuk
async function handleIncomingMessage(ctx) {
  try {
    const senderName = ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : '');
    const messageText = ctx.message?.text || ctx.message?.caption || '[Media]';

    console.log(`📨 Pesan Telegram masuk dari: ${senderName}`);
    console.log(`💬 Isi pesan: ${messageText}`);

    let conversation = await Conversation.findOne({
      platform: 'telegram',
      contact_id: ctx.chat.id.toString()
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'telegram',
        contact_id: ctx.chat.id.toString(),
        contact_name: senderName,
        telegram_id: ctx.chat.id.toString(),
        last_message: messageText,
        last_message_time: new Date()
      });
      console.log('✅ Conversation Telegram baru dibuat');
    } else {
      conversation.contact_name = senderName;
      conversation.last_message = messageText;
      conversation.last_message_time = new Date();
    }

    await conversation.save();

    // Simpan pesan ke database
    const newMessage = new Message({
      platform: 'telegram',
      conversation_id: conversation._id,
      sender_id: ctx.from.id.toString(),
      receiver_id: 'system',
      text: messageText,
      status: 'received'
    });

    await newMessage.save();

    console.log('✅ Pesan Telegram disimpan ke database');

    // Emit real-time update (jika ada socket.io)
    if (global.io) {
      global.io.emit('new-telegram-message', {
        conversation_id: conversation._id,
        message_id: newMessage._id,
        sender_id: ctx.from.id.toString(),
        sender_name: senderName,
        text: messageText,
        timestamp: newMessage.createdAt,
        platform: 'telegram'
      });
    }

  } catch (error) {
    console.error('❌ Error handling Telegram pesan masuk:', error);
  }
}

// ✅ FIXED: Kirim pesan Telegram dengan better error handling
async function sendTelegramMessage(chatId, messageText) {
  try {
    if (!bot) {
      throw new Error('Telegram bot belum siap');
    }

    console.log('📤 Mengirim pesan Telegram ke:', chatId);

    const targetChatId = isNaN(chatId) ? chatId : parseInt(chatId);

    let telegramResponse;
    try {
      telegramResponse = await bot.telegram.sendMessage(targetChatId, messageText);
    } catch (telegramError) {
      console.error('❌ Telegram API Error:', telegramError.message);
      
      if (telegramError.code === 400) {
        throw new Error('Chat tidak ditemukan atau bot diblokir');
      } else if (telegramError.code === 403) {
        throw new Error('Bot tidak memiliki akses ke chat ini');
      } else if (telegramError.code === 429) {
        throw new Error('Rate limit exceeded, coba lagi nanti');
      } else {
        throw new Error(`Telegram API Error: ${telegramError.message}`);
      }
    }

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      platform: 'telegram',
      contact_id: chatId.toString()
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'telegram',
        contact_id: chatId.toString(),
        contact_name: chatId.toString(),
        telegram_id: chatId.toString(),
        last_message: messageText,
        last_message_time: new Date()
      });
      await conversation.save();
    }

    // Simpan pesan yang dikirim
    const newMessage = new Message({
      platform: 'telegram',
      conversation_id: conversation._id,
      sender_id: 'system',
      receiver_id: chatId.toString(),
      text: messageText,
      status: 'sent',
      telegram_message_id: telegramResponse.message_id
    });

    await newMessage.save();

    // Update conversation
    conversation.last_message = messageText;
    conversation.last_message_time = new Date();
    await conversation.save();

    console.log('✅ Pesan Telegram terkirim dan disimpan');

    // Emit real-time update
    if (global.io) {
      global.io.emit('telegram-message-sent', {
        conversation_id: conversation._id,
        message_id: newMessage._id,
        sender_id: 'system',
        receiver_id: chatId.toString(),
        text: messageText,
        timestamp: newMessage.createdAt,
        platform: 'telegram'
      });
    }

    return { 
      success: true, 
      message_id: telegramResponse.message_id,
      text: messageText
    };

  } catch (error) {
    console.error('❌ Error mengirim pesan Telegram:', error);
    throw error;
  }
}

// ==================== BOT INITIALIZATION ====================

// ✅ FIXED: Better initialization with token storage
async function initializeFromEnv() {
  try {
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const envDescription = process.env.TELEGRAM_BOT_DESCRIPTION || 'Telegram Bot';

    if (!envToken) {
      console.log('⚠️ No TELEGRAM_BOT_TOKEN found in .env');
      return;
    }

    return await initializeBot(envToken, envDescription);

  } catch (error) {
    console.error('❌ Error initializing Telegram bot from env:', error);
    return false;
  }
}

// ✅ FIXED: New initialize bot function
async function initializeBot(token, description = 'Telegram Bot') {
  try {
    console.log('🔄 Initializing Telegram bot...');

    // Store bot token
    botToken = token;

    // Initialize bot
    bot = new Telegraf(token);

    // Test bot token
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Bot @${botInfo.username} connected`);

    // Setup message handler
    bot.on('message', handleIncomingMessage);

    // Start bot
    if (process.env.NODE_ENV === 'production' && process.env.BASE_URL) {
      // Production: gunakan webhook
      const webhookUrl = `${process.env.BASE_URL}/api/telegram/webhook/${token}`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log('🔗 Webhook set for production');
    } else {
      // Development: gunakan polling
      bot.launch();
      console.log('🔄 Bot started with polling (development mode)');
    }

    console.log(`✅ Bot "${description}" initialized successfully`);
    return true;

  } catch (error) {
    console.error('❌ Error initializing Telegram bot:', error);
    bot = null;
    botToken = null;
    return false;
  }
}

// ✅ FIXED: Better webhook handler
function webhookHandler(token) {
  return async (req, res) => {
    try {
      if (!bot || botToken !== token) {
        console.error('❌ Bot not initialized or token mismatch');
        return res.status(400).json({ error: 'Bot not initialized' });
      }

      await bot.handleUpdate(req.body);
      res.status(200).json({ success: true });

    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ error: 'Webhook error' });
    }
  };
}

// Webhook handler untuk production
async function handleWebhook(req, res) {
  try {
    if (!bot) {
      return res.status(400).json({ error: 'Bot not initialized' });
    }

    await bot.handleUpdate(req.body);
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
}

// ✅ FIXED: Add status function
async function getTelegramStatus() {
  try {
    if (!bot || !botToken) {
      return {
        isConnected: false,
        bot: null,
        error: 'Bot not initialized'
      };
    }

    const botInfo = await bot.telegram.getMe();
    
    return {
      isConnected: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name
      },
      token: botToken.slice(0, 10) + '...'
    };

  } catch (error) {
    console.error('❌ Error getting Telegram status:', error);
    return {
      isConnected: false,
      bot: null,
      error: error.message
    };
  }
}

// Graceful shutdown
function shutdown() {
  if (bot) {
    console.log('🛑 Shutting down Telegram bot...');
    bot.stop('SIGINT');
    bot = null;
    botToken = null;
  }
}

// ==================== EXPORTS ====================
module.exports = {
  initializeFromEnv,
  initializeBot, 
  sendTelegramMessage,
  handleWebhook,
  webhookHandler,
  getTelegramStatus, 
  shutdown
};