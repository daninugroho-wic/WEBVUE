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

        // Platform Specific IDs (hanya ID, tanpa nama)
        whatsapp_id: { type: String }, // Format: '6281234567890@c.us'
        telegram_id: { type: String }, // Chat ID Telegram
        instagram_id: { type: String }, // Thread ID Instagram

        // Contact Info
        phone_number: { type: String }, // Untuk WhatsApp
        username: { type: String }, // Untuk Telegram (@username) / Instagram (@username)

        // Metadata
        last_message: { type: String },
        last_message_time: { type: Date },
        unread_count: { type: Number, default: 0 },

        // Profile
        profile_pic_url: { type: String },

    },
    {
        timestamps: true,
    }
);

// Virtual untuk mendapatkan platform-specific ID
ConversationSchema.virtual('platform_id').get(function() {
    if (this.platform === 'whatsapp') return this.whatsapp_id;
    if (this.platform === 'telegram') return this.telegram_id;
    if (this.platform === 'instagram') return this.instagram_id;
    return this.contact_id;
});

// Virtual untuk display name
ConversationSchema.virtual('display_name').get(function() {
    return this.contact_name || this.contact_id;
});

// Compound index untuk mencegah duplikasi
ConversationSchema.index({ platform: 1, contact_id: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
