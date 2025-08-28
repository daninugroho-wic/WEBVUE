const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const TelegramSession = require('../models/TelegramSession');
const telegramService = require('../config/telegram');
const mongoose = require('mongoose');

class TelegramController {
    // =============== SESSION MANAGEMENT ===============

    /**
     * Create new Telegram bot session
     */
    static async createSession(req, res) {
        try {
            const { bot_token, description } = req.body;
            
            console.log('🤖 Creating Telegram bot session...');
            
            // Validation
            const validationError = TelegramController._validateSessionInput(bot_token);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            // Test bot token validity
            const tokenValidation = await TelegramController._validateBotToken(bot_token);
            if (!tokenValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: tokenValidation.error
                });
            }

            // Check for existing session
            const existingSession = await TelegramSession.findOne({ bot_token });
            if (existingSession) {
                return res.status(400).json({
                    success: false,
                    error: 'Bot token sudah ada'
                });
            }

            // Create new session
            const session = new TelegramSession({
                bot_token,
                description: description || "Default Telegram Bot",
                bot_info: tokenValidation.botInfo
            });
            
            await session.save();
            
            // Initialize bot
            await telegramService.initializeBot(bot_token, description);
            
            console.log('✅ Telegram bot session created:', tokenValidation.botInfo?.username);
            
            res.json({
                success: true,
                message: 'Bot berhasil ditambahkan dan diinisialisasi',
                session: TelegramController._formatSessionResponse(session)
            });

        } catch (error) {
            console.error('❌ Error creating Telegram session:', error);
            
            const errorResponse = TelegramController._handleSessionError(error);
            res.status(errorResponse.status).json(errorResponse.body);
        }
    }

    /**
     * Get all Telegram bot sessions
     */
    static async getSessions(req, res) {
        try {
            console.log('🔄 Fetching Telegram sessions...');
            
            const sessions = await TelegramSession.find().sort({ createdAt: -1 });
            
            console.log(`✅ Found ${sessions.length} Telegram sessions`);
            
            res.json({
                success: true,
                sessions: sessions.map(session => 
                    TelegramController._formatSessionResponse(session)
                )
            });

        } catch (error) {
            console.error('❌ Error getting Telegram sessions:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil session Telegram'
            });
        }
    }

    /**
     * Delete Telegram bot session
     */
    static async deleteSession(req, res) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ Deleting Telegram session:', id);
            
            const deletedSession = await TelegramSession.findByIdAndDelete(id);
            
            if (!deletedSession) {
                return res.status(404).json({
                    success: false,
                    error: 'Session tidak ditemukan'
                });
            }
            
            console.log('✅ Telegram session deleted:', deletedSession.description);
            
            res.json({
                success: true,
                message: 'Session berhasil dihapus',
                deletedSession: {
                    _id: deletedSession._id,
                    description: deletedSession.description,
                    bot_token: deletedSession.bot_token?.slice(0, 10) + '...'
                }
            });

        } catch (error) {
            console.error('❌ Error deleting Telegram session:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus session'
            });
        }
    }

    // =============== BOT STATUS ===============

    /**
     * Get Telegram bot status
     */
    static async getStatus(req, res) {
        try {
            console.log('📊 Getting Telegram bot status...');
            
            const status = await telegramService.getTelegramStatus();
            
            console.log('✅ Telegram status retrieved:', status);
            
            res.json({ 
                success: true, 
                status 
            });

        } catch (error) {
            console.error('❌ Error getting Telegram status:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Gagal mengambil status Telegram' 
            });
        }
    }

    // =============== CONTACTS MANAGEMENT ===============

    /**
     * Get Telegram contacts/conversations
     */
    static async getContacts(req, res) {
        try {
            console.log('👥 Fetching Telegram contacts...');
            
            const conversations = await Conversation.find({ 
                platform: 'telegram'
            }).sort({ last_message_time: -1 });

            const contacts = conversations.map(conv => ({
                conversation_id: conv._id,
                telegramId: conv.contact_id,
                name: conv.contact_name || conv.contact_id,
                lastMessage: conv.last_message || 'Tidak ada pesan',
                lastTimestamp: conv.last_message_time,
                unreadCount: conv.unread_count || 0
            }));

            console.log(`✅ Found ${contacts.length} Telegram contacts`);

            res.json({
                success: true,
                contacts
            });

        } catch (error) {
            console.error('❌ Error getting Telegram contacts:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil kontak Telegram'
            });
        }
    }

    // =============== MESSAGING ===============

    /**
     * Get messages for specific sender
     */
    static async getMessages(req, res) {
        try {
            const { sender } = req.query;
            
            console.log('💬 Fetching Telegram messages for sender:', sender);
            
            // Validation
            const validationError = TelegramController._validateSender(sender);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            // Find conversation
            let conversation = await Conversation.findOne({
                platform: 'telegram',
                contact_id: sender
            });

            if (!conversation) {
                console.log('⚠️ No conversation found for sender:', sender);
                return res.json({
                    success: true,
                    messages: []
                });
            }

            // Get messages
            const messages = await Message.find({
                conversation_id: conversation._id,
                platform: 'telegram'
            }).sort({ createdAt: 1 });

            console.log(`✅ Found ${messages.length} messages for sender:`, sender);

            res.json({
                success: true,
                messages: messages.map(msg => TelegramController._formatMessageResponse(msg))
            });

        } catch (error) {
            console.error('❌ Error getting Telegram messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan Telegram'
            });
        }
    }

    /**
     * Send Telegram message
     */
    static async sendMessage(req, res) {
        try {
            const { chat_id, message, sender_id } = req.body;

            console.log('📨 Telegram message request:', { 
                chat_id, 
                message: message?.slice(0, 50) + '...', 
                sender_id 
            });

            // Validation
            const validationError = TelegramController._validateMessageInput(chat_id, message, sender_id);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            const trimmedMessage = message.trim();
            
            console.log('📤 Sending Telegram message:', {
                to: chat_id,
                from: sender_id,
                messageLength: trimmedMessage.length
            });

            // Send message through Telegram service
            const telegramResponse = await telegramService.sendTelegramMessage(chat_id, trimmedMessage);

            if (!telegramResponse || !telegramResponse.message_id) {
                throw new Error('Gagal mengirim pesan ke Telegram');
            }

            // Find or create conversation
            const conversation = await TelegramController._findOrCreateConversation(chat_id, trimmedMessage);

            // Save message to database
            const newMessage = new Message({
                platform: 'telegram',
                conversation_id: conversation._id,
                sender_id: sender_id || 'system',
                receiver_id: chat_id,
                text: trimmedMessage,
                status: 'sent',
                telegram_message_id: telegramResponse.message_id
            });

            await newMessage.save();

            console.log('✅ Telegram message sent successfully');

            res.json({
                success: true,
                message: 'Pesan berhasil dikirim',
                data: {
                    message_id: newMessage._id,
                    telegram_message_id: telegramResponse.message_id,
                    status: 'sent'
                }
            });

        } catch (error) {
            console.error('❌ Error sending Telegram message:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Gagal mengirim pesan Telegram'
            });
        }
    }

    /**
     * Receive incoming message from Telegram webhook
     */
    static async receiveMessage(req, res) {
        try {
            const { message } = req.body;

            if (!message || !message.text) {
                return res.json({ success: true });
            }

            console.log('📥 Received Telegram message:', {
                chat_id: message.chat.id,
                from: message.from.first_name,
                text: message.text.slice(0, 50) + '...'
            });

            const chatId = message.chat.id.toString();
            const senderId = message.from.id.toString();
            const senderName = TelegramController._formatSenderName(message.from);

            // Find or create conversation
            const conversation = await TelegramController._findOrCreateConversation(
                chatId, 
                message.text, 
                senderName
            );

            // Save message
            const newMessage = new Message({
                platform: 'telegram',
                conversation_id: conversation._id,
                sender_id: senderId,
                receiver_id: 'system',
                text: message.text,
                status: 'received',
                telegram_message_id: message.message_id
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
                    sender_name: senderName,
                    conversation_id: conversation._id
                });
            }

            console.log('✅ Telegram message processed successfully');

            res.json({ success: true });

        } catch (error) {
            console.error('❌ Error receiving Telegram message:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal memproses pesan masuk'
            });
        }
    }

    /**
     * Get incoming messages (polling endpoint)
     */
    static async getIncomingMessages(req, res) {
        try {
            const { limit = 50 } = req.query;

            console.log('📨 Fetching incoming Telegram messages, limit:', limit);

            const messages = await Message.find({
                platform: 'telegram',
                status: 'received'
            })
            .populate('conversation_id')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

            console.log(`✅ Found ${messages.length} incoming messages`);

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
            console.error('❌ Error getting incoming messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan masuk'
            });
        }
    }

    /**
     * Mark messages as read
     */
    static async markAsRead(req, res) {
        try {
            const { conversation_id } = req.params;

            console.log('👁️ Marking Telegram messages as read:', conversation_id);

            // Validation
            if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
                return res.status(400).json({
                    success: false,
                    error: 'conversation_id tidak valid'
                });
            }

            await Message.updateMany(
                { 
                    conversation_id,
                    platform: 'telegram',
                    status: 'received'
                },
                { is_read: true }
            );

            await Conversation.findByIdAndUpdate(
                conversation_id,
                { unread_count: 0 }
            );

            console.log('✅ Messages marked as read');

            res.json({
                success: true,
                message: 'Pesan ditandai sebagai dibaca'
            });

        } catch (error) {
            console.error('❌ Error marking messages as read:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menandai pesan sebagai dibaca'
            });
        }
    }

    // =============== WEBHOOK HANDLING ===============

    /**
     * Webhook endpoint for Telegram bot
     */
    static webhook(req, res) {
        try {
            const botToken = req.params.token;
            
            console.log('🔔 Telegram webhook called for token:', botToken?.slice(0, 10) + '...');
            
            const handler = telegramService.webhookHandler(botToken);
            return handler(req, res);

        } catch (error) {
            console.error('❌ Webhook error:', error);
            res.status(400).json({ 
                success: false,
                error: 'Invalid bot token' 
            });
        }
    }

    // =============== PRIVATE HELPER METHODS ===============

    /**
     * Validate session input
     */
    static _validateSessionInput(bot_token) {
        if (!bot_token) {
            return 'Bot token diperlukan';
        }

        // Basic Telegram bot token format validation
        const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
        if (!tokenRegex.test(bot_token)) {
            return 'Format bot token tidak valid';
        }

        return null;
    }

    /**
     * Validate bot token with Telegram API
     */
    static async _validateBotToken(bot_token) {
        try {
            const { Telegraf } = require('telegraf');
            const testBot = new Telegraf(bot_token);
            const botInfo = await testBot.telegram.getMe();
            
            return {
                valid: true,
                botInfo: {
                    id: botInfo.id,
                    username: botInfo.username,
                    first_name: botInfo.first_name
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Token bot tidak valid atau tidak dapat diakses'
            };
        }
    }

    /**
     * Validate sender parameter
     */
    static _validateSender(sender) {
        if (!sender) {
            return 'Parameter sender diperlukan';
        }

        if (sender.trim() === '') {
            return 'Parameter sender tidak boleh kosong';
        }

        return null;
    }

    /**
     * Validate message input
     */
    static _validateMessageInput(chat_id, message, sender_id) {
        if (!chat_id || chat_id.toString().trim() === '') {
            return 'chat_id diperlukan dan tidak boleh kosong';
        }

        if (!message || message.trim() === '') {
            return 'message diperlukan dan tidak boleh kosong';
        }

        if (!sender_id || sender_id.trim() === '') {
            return 'sender_id diperlukan dan tidak boleh kosong';
        }

        return null;
    }

    /**
     * Format sender name from Telegram user object
     */
    static _formatSenderName(from) {
        return from.first_name + (from.last_name ? ` ${from.last_name}` : '');
    }

    /**
     * Find or create conversation
     */
    static async _findOrCreateConversation(chatId, message, senderName = null) {
        let conversation = await Conversation.findOne({
            platform: 'telegram',
            contact_id: chatId
        });

        if (!conversation) {
            conversation = new Conversation({
                platform: 'telegram',
                contact_id: chatId,
                contact_name: senderName,
                telegram_id: chatId,
                last_message: message,
                last_message_time: new Date(),
                unread_count: senderName ? 1 : 0 // Only count if incoming message
            });
        } else {
            if (senderName) {
                conversation.contact_name = senderName;
                conversation.unread_count += 1;
            }
            conversation.last_message = message;
            conversation.last_message_time = new Date();
        }

        await conversation.save();
        return conversation;
    }

    /**
     * Format session response
     */
    static _formatSessionResponse(session) {
        return {
            _id: session._id,
            bot_token: session.bot_token?.slice(0, 10) + '...', // Hide full token
            description: session.description,
            bot_info: session.bot_info,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
    }

    /**
     * Format message response
     */
    static _formatMessageResponse(msg) {
        return {
            _id: msg._id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            text: msg.text,
            status: msg.status,
            messageSource: msg.messageSource,
            created_at: msg.createdAt,
            createdAt: msg.createdAt, // For compatibility
            telegram_message_id: msg.telegram_message_id
        };
    }

    /**
     * Handle session creation errors
     */
    static _handleSessionError(error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'Bot token sudah ada'
                }
            };
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return {
                status: 400,
                body: {
                    success: false,
                    error: validationErrors.join(', ')
                }
            };
        }
        
        // Generic server error
        return {
            status: 500,
            body: {
                success: false,
                error: 'Gagal membuat session Telegram'
            }
        };
    }
}

module.exports = TelegramController;