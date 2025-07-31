const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
    {
        // Platform
        platform: {
            type: String,
            enum: ['whatsapp', 'telegram', 'instagram'],
            required: true
        },

        // Identitas Kontak
        contact_id: { type: String, required: true }, // ID kontak (nomor/username)
        contact_name: { type: String },

        // Platform Specific IDs
        whatsapp_id: { type: String }, // Format: '6281234567890@c.us'
        telegram_chat_id: { type: String }, // Chat ID Telegram
        telegram_username: { type: String }, // Username Telegram
        instagram_thread_id: { type: String }, // Thread ID Instagram

        // Metadata
        last_message: { type: String },
        last_message_time: { type: Date },
        unread_count: { type: Number, default: 0 },
        is_active: { type: Boolean, default: true },
        is_blocked: { type: Boolean, default: false },

        // Profile
        profile_pic_url: { type: String },

    },
    {
        timestamps: true,
    }
);

// Compound index untuk mencegah duplikasi
ConversationSchema.index({ platform: 1, contact_id: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
