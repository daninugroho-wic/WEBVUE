const InstagramSession = require('../models/InstagramSession');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const instagramService = require('../config/instagram');
const mongoose = require('mongoose');

class InstagramController {
    // =============== SESSION MANAGEMENT ===============
    
    /**
     * Create new Instagram session
     */
    static async createSession(req, res) {
        try {
            const { username, description } = req.body;
            
            // Validation
            const validationError = InstagramController._validateSessionInput(username);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            // Check for existing session
            const existingSession = await InstagramSession.findOne({ username });
            if (existingSession) {
                return res.status(400).json({
                    success: false,
                    error: 'Username Instagram sudah ada'
                });
            }

            // Create new session
            const session = new InstagramSession({
                username,
                description: description || "Default Instagram Account"
            });
            
            await session.save();
            
            console.log('✅ Instagram session created:', username);
            
            res.json({
                success: true,
                message: 'Session Instagram berhasil dibuat',
                session: InstagramController._formatSessionResponse(session)
            });

        } catch (error) {
            console.error('❌ Error creating Instagram session:', error);
            
            const errorResponse = InstagramController._handleSessionError(error);
            res.status(errorResponse.status).json(errorResponse.body);
        }
    }

    /**
     * Get all Instagram sessions
     */
    static async getSessions(req, res) {
        try {
            console.log('🔄 Fetching Instagram sessions...');
            
            const sessions = await InstagramSession.find().sort({ createdAt: -1 });
            
            console.log(`✅ Found ${sessions.length} Instagram sessions`);
            
            res.json({
                success: true,
                sessions: sessions.map(session => 
                    InstagramController._formatSessionResponse(session)
                )
            });

        } catch (error) {
            console.error('❌ Error getting Instagram sessions:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil session Instagram'
            });
        }
    }

    /**
     * Delete Instagram session
     */
    static async deleteSession(req, res) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ Deleting Instagram session:', id);
            
            const deletedSession = await InstagramSession.findByIdAndDelete(id);
            
            if (!deletedSession) {
                return res.status(404).json({
                    success: false,
                    error: 'Session tidak ditemukan'
                });
            }
            
            console.log('✅ Instagram session deleted:', deletedSession.username);
            
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
            console.error('❌ Error deleting Instagram session:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus session'
            });
        }
    }

    // =============== AUTHENTICATION ===============
    
    /**
     * Login to Instagram
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username dan password diperlukan'
                });
            }

            console.log('🔐 Attempting Instagram login for:', username);

            const result = await instagramService.loginInstagram(username, password);
            
            if (result.success) {
                console.log('✅ Instagram login successful for:', username);
                
                res.json({
                    success: true,
                    message: 'Login Instagram berhasil'
                });
            } else if (result.challenge) {
                console.log('🔒 Instagram challenge required for:', username);
                
                res.json({
                    success: false,
                    challenge: true,
                    challengeData: result.challenge,
                    message: 'Challenge diperlukan'
                });
            } else {
                console.log('❌ Instagram login failed for:', username);
                
                res.status(401).json({
                    success: false,
                    error: result.error || 'Login gagal'
                });
            }

        } catch (error) {
            console.error('❌ Error Instagram login:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal login Instagram'
            });
        }
    }

    /**
     * Logout from Instagram
     */
    static async logout(req, res) {
        try {
            console.log('🚪 Logging out from Instagram...');
            
            await instagramService.logoutInstagram();
            
            console.log('✅ Instagram logout successful');
            
            res.json({ 
                success: true, 
                message: 'Logout Instagram berhasil' 
            });

        } catch (error) {
            console.error('❌ Error Instagram logout:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Gagal logout Instagram' 
            });
        }
    }

    /**
     * Get Instagram status
     */
    static async getStatus(req, res) {
        try {
            console.log('📊 Getting Instagram status...');
            
            const status = await instagramService.getInstagramStatus();
            
            console.log('✅ Instagram status retrieved:', status);
            
            res.json({ success: true, status });

        } catch (error) {
            console.error('❌ Error getting Instagram status:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Gagal mengambil status Instagram' 
            });
        }
    }

    // =============== CONTACTS MANAGEMENT ===============
    
    /**
     * Get Instagram contacts/conversations
     */
    static async getContacts(req, res) {
        try {
            console.log('👥 Fetching Instagram contacts...');
            
            const conversations = await Conversation.find({ 
                platform: 'instagram'
            }).sort({ last_message_time: -1 });

            const contacts = conversations.map(conv => ({
                conversation_id: conv._id,
                contact_id: conv.contact_id,
                name: conv.contact_name || conv.contact_id,
                lastMessage: conv.last_message || 'Tidak ada pesan',
                lastTimestamp: conv.last_message_time,
                unreadCount: conv.unread_count || 0
            }));

            console.log(`✅ Found ${contacts.length} Instagram contacts`);

            res.json({
                success: true,
                contacts
            });

        } catch (error) {
            console.error('❌ Error getting Instagram contacts:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil kontak Instagram'
            });
        }
    }

    // =============== MESSAGING ===============
    
    /**
     * Get messages for conversation
     */
    static async getMessages(req, res) {
        try {
            const { conversation_id } = req.query;
            
            console.log('💬 Fetching messages for conversation:', conversation_id);

            // Validation
            const validationError = InstagramController._validateConversationId(conversation_id);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            const messages = await Message.find({ 
                conversation_id: conversation_id 
            }).sort({ createdAt: 1 });

            console.log(`✅ Found ${messages.length} messages for conversation:`, conversation_id);

            res.json({
                success: true,
                messages: messages.map(msg => InstagramController._formatMessageResponse(msg))
            });

        } catch (error) {
            console.error('❌ Error getting Instagram messages:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan Instagram'
            });
        }
    }

    /**
     * Send Instagram DM
     */
    static async sendMessage(req, res) {
        try {
            const { user_id, message, sender_id } = req.body;

            console.log('📨 Instagram DM request:', { user_id, message: message?.slice(0, 50) + '...', sender_id });

            // Validation
            const validationError = InstagramController._validateMessageInput(user_id, message, sender_id);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            const trimmedMessage = message.trim();
            
            console.log('📤 Sending Instagram DM:', {
                to: user_id,
                from: sender_id,
                messageLength: trimmedMessage.length
            });

            // Send message through Instagram service
            const result = await instagramService.sendInstagramDM(user_id, trimmedMessage);
            
            if (result.success) {
                console.log('✅ Instagram DM sent successfully');
                
                res.json({
                    success: true,
                    message: 'Pesan Instagram berhasil dikirim',
                    message_id: result.message_id
                });
            } else {
                console.log('❌ Instagram DM failed:', result.error);
                
                res.status(500).json({
                    success: false,
                    error: result.error || 'Gagal mengirim pesan Instagram'
                });
            }

        } catch (error) {
            console.error('❌ Error sending Instagram message:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Gagal mengirim pesan Instagram'
            });
        }
    }

    // =============== PRIVATE HELPER METHODS ===============
    
    /**
     * Validate session input
     */
    static _validateSessionInput(username) {
        if (!username) {
            return 'Username Instagram diperlukan';
        }

        const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
        if (!usernameRegex.test(username)) {
            return 'Format username Instagram tidak valid';
        }

        return null;
    }

    /**
     * Validate conversation ID
     */
    static _validateConversationId(conversation_id) {
        if (!conversation_id || conversation_id === 'undefined' || conversation_id === 'null') {
            return 'conversation_id diperlukan dan harus valid';
        }

        if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
            return 'Format conversation_id tidak valid';
        }

        return null;
    }

    /**
     * Validate message input
     */
    static _validateMessageInput(user_id, message, sender_id) {
        if (!user_id || user_id.trim() === '') {
            return 'user_id diperlukan dan tidak boleh kosong';
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
     * Format session response
     */
    static _formatSessionResponse(session) {
        return {
            _id: session._id,
            username: session.username,
            description: session.description,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            __v: session.__v
        };
    }

    /**
     * Format message response
     */
    static _formatMessageResponse(msg) {
        return {
            _id: msg._id,
            text: msg.text,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            status: msg.status,
            platform: msg.platform,
            created_at: msg.createdAt,
            conversation_id: msg.conversation_id
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
                    error: 'Username Instagram sudah ada'
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
                error: 'Gagal membuat session Instagram'
            }
        };
    }
}

module.exports = InstagramController;