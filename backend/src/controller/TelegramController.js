const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const TelegramSession = require('../models/TelegramSession'); // ← ADD THIS
const telegramService = require('../config/telegram');

class TelegramController {
    // Mendapatkan semua kontak/conversations Telegram
    static async getContacts(req, res) {
        try {
            const conversations = await Conversation.find({ 
                platform: 'telegram'
            }).sort({ last_message_time: -1 });

            const contacts = conversations.map(conv => ({
                conversation_id: conv._id,
                telegramId: conv.contact_id,
                name: conv.contact_name || conv.contact_id,
                lastMessage: conv.last_message || 'Tidak ada pesan',
                lastTimestamp: conv.last_message_time,
                unreadCount: conv.unread_count
            }));

            res.json({
                success: true,
                contacts
            });
        } catch (error) {
            console.error('Error getting Telegram contacts:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil kontak Telegram'
            });
        }
    }

    // Mendapatkan pesan berdasarkan sender
    static async getMessages(req, res) {
        try {
            const { sender } = req.query;
            
            if (!sender) {
                return res.status(400).json({
                    success: false,
                    error: 'Parameter sender diperlukan'
                });
            }

            // Cari conversation
            let conversation = await Conversation.findOne({
                platform: 'telegram',
                contact_id: sender
            });

            if (!conversation) {
                return res.json({
                    success: true,
                    messages: []
                });
            }

            // Ambil pesan
            const messages = await Message.find({
                conversation_id: conversation._id,
                platform: 'telegram'
            }).sort({ createdAt: 1 });

            res.json({
                success: true,
                messages: messages.map(msg => ({
                    _id: msg._id,
                    sender_id: msg.sender_id,
                    receiver_id: msg.receiver_id,
                    text: msg.text,
                    status: msg.status,
                    messageSource: msg.messageSource,
                    created_at: msg.createdAt,
                    telegram_message_id: msg.telegram_message_id
                }))
            });
        } catch (error) {
            console.error('Error getting Telegram messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan Telegram'
            });
        }
    }

    // Mengirim pesan Telegram
    static async sendMessage(req, res) {
        try {
            const { chat_id, message, sender_id } = req.body;

            if (!chat_id || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'chat_id dan message diperlukan'
                });
            }

            // Ganti pemanggilan fungsi di bawah ini
            const telegramResponse = await telegramService.sendTelegramMessage(chat_id, message);

            // Cari atau buat conversation
            let conversation = await Conversation.findOne({
                platform: 'telegram',
                contact_id: chat_id
            });

            if (!conversation) {
                conversation = new Conversation({
                    platform: 'telegram',
                    contact_id: chat_id,
                    telegram_id: chat_id,  // ← Sync dengan Conversation model
                    last_message: message,
                    last_message_time: new Date()
                });
                await conversation.save();
            } else {
                conversation.last_message = message;
                conversation.last_message_time = new Date();
                await conversation.save();
            }

            // Simpan pesan ke database
            const newMessage = new Message({
                platform: 'telegram',
                conversation_id: conversation._id,
                sender_id: sender_id || 'system',
                receiver_id: chat_id,
                text: message,
                status: 'sent'
            });

            await newMessage.save();

            res.json({
                success: true,
                message: 'Pesan berhasil dikirim',
                data: {
                    message_id: newMessage._id,
                    telegram_message_id: telegramResponse?.message_id,
                    status: 'sent'
                }
            });
        } catch (error) {
            console.error('Error sending Telegram message:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengirim pesan Telegram'
            });
        }
    }

    // Menerima pesan masuk dari webhook Telegram
    static async receiveMessage(req, res) {
        try {
            const { message } = req.body;

            if (!message || !message.text) {
                return res.json({ success: true });
            }

            const chatId = message.chat.id.toString();
            const senderId = message.from.id.toString();
            const senderName = message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');

            // Cari atau buat conversation
            let conversation = await Conversation.findOne({
                platform: 'telegram',
                contact_id: chatId
            });

            if (!conversation) {
                conversation = new Conversation({
                    platform: 'telegram',
                    contact_id: chatId,
                    contact_name: senderName,
                    telegram_id: chatId,  // ← Sync dengan model
                    last_message: message.text,
                    last_message_time: new Date(),
                    unread_count: 1
                });
            } else {
                conversation.contact_name = senderName;
                conversation.last_message = message.text;
                conversation.last_message_time = new Date();
                conversation.unread_count += 1;
            }

            await conversation.save();

            // Simpan pesan
            const newMessage = new Message({
                platform: 'telegram',
                conversation_id: conversation._id,
                sender_id: senderId,
                receiver_id: 'system',
                text: message.text,
                status: 'received'
            });

            await newMessage.save();

            // Emit to socket
            const io = req.app.get('io');
            if (io) {
                io.emit('new-telegram-message', {
                    message_id: newMessage._id,
                    sender_id: senderId,
                    text: message.text,
                    timestamp: newMessage.createdAt,
                    chat_id: chatId,
                    sender_name: senderName
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error receiving Telegram message:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal memproses pesan masuk'
            });
        }
    }

    // Endpoint untuk mendapatkan pesan masuk (polling)
    static async getIncomingMessages(req, res) {
        try {
            const { limit = 50 } = req.query;

            const messages = await Message.find({
                platform: 'telegram',
                status: 'received'  // ← Sync dengan Message model
            })
            .populate('conversation_id')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

            res.json({
                success: true,
                messages: messages.map(msg => ({
                    _id: msg._id,
                    sender_id: msg.sender_id,
                    text: msg.text,
                    created_at: msg.createdAt,
                    conversation: msg.conversation_id
                }))
            });
        } catch (error) {
            console.error('Error getting incoming messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan masuk'
            });
        }
    }

    // Menandai pesan sebagai dibaca
    static async markAsRead(req, res) {
        try {
            const { conversation_id } = req.params;

            await Message.updateMany(
                { 
                    conversation_id,
                    platform: 'telegram',
                    messageSource: 'incoming'
                },
                { is_read: true }
            );

            await Conversation.findByIdAndUpdate(
                conversation_id,
                { unread_count: 0 }
            );

            res.json({
                success: true,
                message: 'Pesan ditandai sebagai dibaca'
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menandai pesan sebagai dibaca'
            });
        }
    }

    // Webhook endpoint untuk menerima pesan
    static webhook(req, res) {
        console.log('🔔 Webhook Telegram dipanggil:', req.body);
        try {
            const botToken = req.params.token;
            const handler = telegramService.webhookHandler(botToken);
            return handler(req, res);
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(400).json({ error: 'Invalid bot token' });
        }
    }

    // Create session dan initialize bot
    static async createSession(req, res) {
        try {
            const { bot_token, description } = req.body;
            
            // Test bot token first
            const { Telegraf } = require('telegraf');
            const testBot = new Telegraf(bot_token);
            await testBot.telegram.getMe(); // Test if token is valid
            
            // Save to database
            const session = new TelegramSession({
                bot_token,
                description
            });
            await session.save();
            
            // Initialize bot
            await telegramService.initializeBot(bot_token, description);
            
            res.json({
                success: true,
                message: 'Bot berhasil ditambahkan dan diinisialisasi',
                session
            });
        } catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({
                success: false,
                error: 'Token bot tidak valid atau gagal membuat session'
            });
        }
    }

    // ✅ ADD: Get all sessions
    static async getSessions(req, res) {
        try {
            const sessions = await TelegramSession.find().sort({ createdAt: -1 });
            
            res.json({
                success: true,
                sessions
            });
        } catch (error) {
            console.error('Error getting telegram sessions:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil session Telegram'
            });
        }
    }

    // ✅ ADD: Delete session
    static async deleteSession(req, res) {
        try {
            const { id } = req.params;
            
            await TelegramSession.findByIdAndDelete(id);
            
            res.json({
                success: true,
                message: 'Session berhasil dihapus'
            });
        } catch (error) {
            console.error('Error deleting telegram session:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus session'
            });
        }
    }
}

module.exports = TelegramController;