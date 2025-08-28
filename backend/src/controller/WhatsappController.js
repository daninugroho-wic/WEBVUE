const { client, sendWhatsAppMessage, getClientStatus } = require('../config/whatsapp');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const WhatsAppSession = require('../models/WhatsAppSession');

class WhatsAppController {
    // =============== SESSION MANAGEMENT ===============

    static async getSessions(req, res) {
        try {
            const sessions = await WhatsAppSession.find().sort({ createdAt: -1 });
            
            res.json({
                success: true,
                sessions: sessions.map(session => ({
                    _id: session._id,
                    phone_number: session.phone_number,
                    description: session.description,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                }))
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil session WhatsApp'
            });
        }
    }

    static async createSession(req, res) {
        try {
            const { phone_number, description } = req.body;

            if (!phone_number) {
                return res.status(400).json({
                    success: false,
                    error: 'Nomor telepon diperlukan'
                });
            }

            const phoneRegex = /^[\d\-+\s()]+$/;
            if (!phoneRegex.test(phone_number)) {
                return res.status(400).json({
                    success: false,
                    error: 'Format nomor telepon tidak valid'
                });
            }

            const existingSession = await WhatsAppSession.findOne({ phone_number });
            if (existingSession) {
                return res.status(400).json({
                    success: false,
                    error: 'WhatsApp session sudah ada'
                });
            }

            const session = new WhatsAppSession({
                phone_number,
                description: description || 'WhatsApp Session'
            });

            await session.save();

            res.status(201).json({
                success: true,
                message: 'Session WhatsApp berhasil dibuat',
                session: {
                    _id: session._id,
                    phone_number: session.phone_number,
                    description: session.description,
                    createdAt: session.createdAt
                }
            });

        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: 'WhatsApp session sudah ada'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Gagal membuat session WhatsApp'
            });
        }
    }

    static async deleteSession(req, res) {
        try {
            const { id } = req.params;
            
            const deletedSession = await WhatsAppSession.findByIdAndDelete(id);
            
            if (!deletedSession) {
                return res.status(404).json({
                    success: false,
                    error: 'Session tidak ditemukan'
                });
            }
            
            res.json({
                success: true,
                message: 'Session berhasil dihapus'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus session'
            });
        }
    }

    // =============== CLIENT STATUS ===============

    static async getStatus(req, res) {
        try {
            const status = getClientStatus();
            
            res.json({
                success: true,
                status
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mendapatkan status WhatsApp'
            });
        }
    }

    // =============== CONTACTS MANAGEMENT ===============

    static async getContacts(req, res) {
        try {
            const { platform = 'whatsapp' } = req.query;

            const conversations = await Conversation.find({ platform })
                .sort({ last_message_time: -1 });

            const contacts = conversations.map(conv => ({
                _id: conv._id,
                whatsapp_id: conv.whatsapp_id,
                contact_id: conv.contact_id,
                contact_name: conv.contact_name,
                phone_number: conv.phone_number,
                last_message: conv.last_message || 'Tidak ada pesan',
                last_message_time: conv.last_message_time || conv.createdAt,
                is_blocked: conv.is_blocked || false,
                profile_pic_url: conv.profile_pic_url
            }));

            res.json({
                success: true,
                conversations: contacts
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil daftar percakapan'
            });
        }
    }

    static async saveConversation(req, res) {
        try {
            const { platform, contact_id, contact_name, whatsapp_id, phone_number } = req.body;

            if (!platform || !contact_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Platform dan contact_id diperlukan'
                });
            }

            const existingConversation = await Conversation.findOne({ 
                platform, 
                contact_id 
            });

            if (existingConversation) {
                return res.status(400).json({
                    success: false,
                    message: 'Conversation sudah ada'
                });
            }

            const newConversation = new Conversation({
                platform,
                contact_id,
                contact_name: contact_name || contact_id.replace('@c.us', ''),
                whatsapp_id: platform === 'whatsapp' ? (whatsapp_id || contact_id) : undefined,
                phone_number: platform === 'whatsapp' ? (phone_number || contact_id.replace('@c.us', '')) : undefined,
                last_message_time: new Date()
            });

            await newConversation.save();

            res.status(201).json({
                success: true,
                conversation: {
                    _id: newConversation._id,
                    platform: newConversation.platform,
                    contact_id: newConversation.contact_id,
                    contact_name: newConversation.contact_name,
                    whatsapp_id: newConversation.whatsapp_id,
                    phone_number: newConversation.phone_number,
                    last_message_time: newConversation.last_message_time,
                    createdAt: newConversation.createdAt
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal menyimpan conversation'
            });
        }
    }

    // =============== MESSAGING ===============

    static async sendMessage(req, res) {
        try {
            const { number, message, sender_id = '083866474123@c.us' } = req.body;

            if (!number || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'Nomor dan pesan diperlukan'
                });
            }

            if (message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Pesan tidak boleh kosong'
                });
            }

            const status = getClientStatus();
            
            if (!status.isReady) {
                return res.status(503).json({
                    success: false,
                    error: 'WhatsApp client belum siap'
                });
            }

            const result = await sendWhatsAppMessage(number, message, sender_id);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Pesan berhasil dikirim',
                    messageId: result.messageId,
                    timestamp: result.timestamp
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error || 'Gagal mengirim pesan'
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mengirim pesan WhatsApp'
            });
        }
    }

    static async getMessagesBySender(req, res) {
        try {
            const { sender } = req.query;

            if (!sender) {
                return res.status(400).json({
                    success: false,
                    error: "Parameter 'sender' wajib diisi"
                });
            }

            const conversation = await Conversation.findOne({
                platform: 'whatsapp',
                contact_id: sender
            });

            if (!conversation) {
                return res.json({
                    success: true,
                    messages: []
                });
            }

            const messages = await Message.find({
                conversation_id: conversation._id,
                platform: 'whatsapp'
            }).sort({ createdAt: 1 });

            res.json({
                success: true,
                messages: messages.map(msg => ({
                    _id: msg._id,
                    sender_id: msg.sender_id,
                    receiver_id: msg.receiver_id,
                    text: msg.text,
                    status: msg.status,
                    send_by: msg.send_by,
                    created_at: msg.createdAt,
                    timestamp: msg.createdAt
                }))
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan berdasarkan sender'
            });
        }
    }

    static async getReceivedMessages(req, res) {
        try {
            const { limit = 50 } = req.query;

            const messages = await Message.find({
                status: 'received',
                platform: 'whatsapp'
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

            const formattedMessages = messages.map(msg => ({
                message_id: msg._id,
                sender_id: msg.sender_id,
                text: msg.text,
                date: new Date(msg.createdAt).toLocaleDateString('id-ID'),
                time: new Date(msg.createdAt).toLocaleTimeString('id-ID'),
                status: 'received',
                timestamp: msg.createdAt
            }));

            res.json({
                success: true,
                messages: formattedMessages
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil pesan masuk'
            });
        }
    }
}

module.exports = {
    sendMessage: WhatsAppController.sendMessage,
    getMessagesBySender: WhatsAppController.getMessagesBySender,
    getReceivedMessages: WhatsAppController.getReceivedMessages,
    getConversations: WhatsAppController.getContacts,
    saveConversation: WhatsAppController.saveConversation,
    getWhatsAppStatus: WhatsAppController.getStatus,
    getWhatsAppSessions: WhatsAppController.getSessions,
    saveWhatsAppSession: WhatsAppController.createSession,
    deleteWhatsAppSession: WhatsAppController.deleteSession
};