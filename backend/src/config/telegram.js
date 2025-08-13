// config/telegram.js
const { Telegraf } = require('telegraf');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let bot = null;

// ==================== MESSAGE HANDLERS ====================

// Handle pesan masuk
async function handleIncomingMessage(ctx) {
  try {
    const senderName = ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : '');
    const messageText = ctx.message?.text || ctx.message?.caption || '[Media]';

    // Tambahkan log berikut
    console.log(`📨 Pesan Telegram masuk dari: ${senderName}`);
    console.log(`💬 Isi pesan: ${messageText}`);

    // Cari atau buat conversation
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

// Kirim pesan Telegram
async function sendTelegramMessage(chatId, messageText) {
  try {
    if (!bot) {
      throw new Error('Telegram bot belum siap');
    }

    console.log('📤 Mengirim pesan Telegram ke:', chatId);

    // Kirim pesan
    await bot.telegram.sendMessage(chatId, messageText);

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      platform: 'telegram',
      contact_id: chatId
    });

    if (!conversation) {
      conversation = new Conversation({
        platform: 'telegram',
        contact_id: chatId,
        contact_name: chatId,
        telegram_id: chatId,
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
      receiver_id: chatId,
      text: messageText,
      status: 'sent'
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
        receiver_id: chatId,
        text: messageText,
        timestamp: newMessage.createdAt,
        platform: 'telegram'
      });
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error mengirim pesan Telegram:', error);
    throw error;
  }
}

// ==================== BOT INITIALIZATION ====================

async function initializeFromEnv() {
  try {
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const envDescription = process.env.TELEGRAM_BOT_DESCRIPTION || 'Telegram Bot';

    if (!envToken) {
      console.log('⚠️ No TELEGRAM_BOT_TOKEN found in .env');
      return;
    }

    console.log('🔄 Initializing Telegram bot from .env...');

    // Initialize bot
    bot = new Telegraf(envToken);

    // Test bot token
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Bot @${botInfo.username} connected`);

    // Setup message handler
    bot.on('message', handleIncomingMessage);

    // Start bot
    if (process.env.NODE_ENV === 'production' && process.env.BASE_URL) {
      // Production: gunakan webhook
      const webhookUrl = `${process.env.BASE_URL}/api/telegram/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log('🔗 Webhook set for production');
    } else {
      // Development: gunakan polling
      bot.launch();
      console.log('🔄 Bot started with polling (development mode)');
    }

    console.log(`✅ Bot "${envDescription}" initialized successfully`);

  } catch (error) {
    console.error('❌ Error initializing Telegram bot:', error);
  }
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

// Graceful shutdown
function shutdown() {
  if (bot) {
    console.log('🛑 Shutting down Telegram bot...');
    bot.stop('SIGINT');
  }
}

// ==================== EXPORTS ====================
module.exports = {
  initializeFromEnv,
  sendTelegramMessage,
  handleWebhook,
  shutdown
};