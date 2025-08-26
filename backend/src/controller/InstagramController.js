const InstagramSession = require('../models/InstagramSession');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const instagramService = require('../config/instagram');

class InstagramController {
    // Create Instagram session
    static async createSession(req, res) {
        try {
            const { username, description } = req.body;
            
            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'Username Instagram diperlukan'
                });
            }

            // Validate username format
            const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    success: false,
                    error: 'Format username Instagram tidak valid'
                });
            }

            // Check if username already exists
            const existingSession = await InstagramSession.findOne({ username });
            if (existingSession) {
                return res.status(400).json({
                    success: false,
                    error: 'Username Instagram sudah ada'
                });
            }

            // Create new session with default description
            const session = new InstagramSession({
                username,
                description: description || "Default Instagram Account"
            });
            
            await session.save();
            
            res.json({
                success: true,
                message: 'Session Instagram berhasil dibuat',
                session: {
                    _id: session._id,
                    username: session.username,
                    description: session.description,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    __v: session.__v
                }
            });
        } catch (error) {
            console.error('Error creating Instagram session:', error);
            
            // Handle MongoDB duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: 'Username Instagram sudah ada'
                });
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    error: validationErrors.join(', ')
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Gagal membuat session Instagram'
            });
        }
    }

    // Get all Instagram sessions
    static async getSessions(req, res) {
        try {
            const sessions = await InstagramSession.find().sort({ createdAt: -1 });
            
            res.json({
                success: true,
                sessions: sessions.map(session => ({
                    _id: session._id,
                    username: session.username,
                    description: session.description,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    __v: session.__v
                }))
            });
        } catch (error) {
            console.error('Error getting Instagram sessions:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil session Instagram'
            });
        }
    }

    // Delete Instagram session
    static async deleteSession(req, res) {
        try {
            const { id } = req.params;
            
            const deletedSession = await InstagramSession.findByIdAndDelete(id);
            
            if (!deletedSession) {
                return res.status(404).json({
                    success: false,
                    error: 'Session tidak ditemukan'
                });
            }
            
            res.json({
                success: true,
                message: 'Session berhasil dihapus',
                deletedSession: {
                    _id: deletedSession._id,
                    username: deletedSession.username,
                    description: deletedSession.description
                }
            });
        } catch (error) {
            console.error('Error deleting Instagram session:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus session'
            });
        }
    }

    // Login to Instagram
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username dan password diperlukan'
                });
            }

            const result = await instagramService.loginInstagram(username, password);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Login Instagram berhasil'
                });
            } else if (result.challenge) {
                res.json({
                    success: false,
                    challenge: true,
                    challengeData: result.challenge,
                    message: 'Challenge diperlukan'
                });
            }
        } catch (error) {
            console.error('Error Instagram login:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal login Instagram'
            });
        }
    }

    // Get Instagram contacts/conversations
    static async getContacts(req, res) {
        try {
            const conversations = await Conversation.find({ 
                platform: 'instagram'
            }).sort({ last_message_time: -1 });

            const contacts = conversations.map(conv => ({
                conversation_id: conv._id,
                contact_id: conv.contact_id, // gunakan contact_id sesuai model
                name: conv.contact_name || conv.contact_id,
                lastMessage: conv.last_message || 'Tidak ada pesan',
                lastTimestamp: conv.last_message_time,
                unreadCount: conv.unread_count || 0
            }));

            res.json({
                success: true,
                contacts
            });
        } catch (error) {
            console.error('Error getting Instagram contacts:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil kontak Instagram'
            });
        }
    }

    // Get messages for conversation
    static async getMessages(req, res) {
        try {
            const { conversation_id } = req.query;
            
            console.log('Query params received:', req.query);
            console.log('conversation_id:', conversation_id);

            // PERBAIKAN: Validasi conversation_id
            if (!conversation_id || conversation_id === 'undefined' || conversation_id === 'null') {
                return res.status(400).json({
                    success: false,
                    error: 'conversation_id diperlukan dan harus valid'
                });
            }

            // Validasi format ObjectId
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Format conversation_id tidak valid'
                });
            }

            const messages = await Message.find({ 
                conversation_id: conversation_id 
            }).sort({ createdAt: 1 });

            res.json({
                success: true,
                messages: messages.map(msg => ({
                    _id: msg._id,
                    text: msg.text,
                    sender_id: msg.sender_id,
                    receiver_id: msg.receiver_id,
                    status: msg.status,
                    platform: msg.platform,
                    created_at: msg.createdAt,
                    conversation_id: msg.conversation_id
                }))
            });

        } catch (error) {
            console.error('Error getting Instagram messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan Instagram'
            });
        }
    }

    // Send Instagram DM
    static async sendMessage(req, res) {
        try {
            console.log('📨 Request body:', req.body);

            const { user_id, message, sender_id } = req.body;

            // PERBAIKAN: Validasi yang lebih detail
            if (!user_id || user_id.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'user_id diperlukan dan tidak boleh kosong' 
                });
            }

            if (!message || message.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'message diperlukan dan tidak boleh kosong' 
                });
            }

            if (!sender_id || sender_id.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'sender_id diperlukan dan tidak boleh kosong' 
                });
            }

            // Trim message untuk memastikan tidak ada whitespace berlebih
            const trimmedMessage = message.trim();
            
            console.log('📤 Mengirim DM Instagram:');
            console.log('   - To:', user_id);
            console.log('   - Message:', trimmedMessage);
            console.log('   - From:', sender_id);

            // Kirim pesan melalui Instagram service
            const result = await instagramService.sendInstagramDM(user_id, trimmedMessage);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Pesan Instagram berhasil dikirim',
                    message_id: result.message_id
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error || 'Gagal mengirim pesan Instagram'
                });
            }

        } catch (error) {
            console.error('❌ Error sendMessage:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Gagal mengirim pesan Instagram'
            });
        }
    }

    // Get Instagram status
    static async getStatus(req, res) {
        try {
            const status = await instagramService.getInstagramStatus();
            res.json({ success: true, status });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Gagal mengambil status Instagram' });
        }
    }

    // Logout from Instagram
    static async logout(req, res) {
        try {
            await instagramService.logoutInstagram();
            res.json({ success: true, message: 'Logout Instagram berhasil' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Gagal logout Instagram' });
        }
    }
}

module.exports = InstagramController;