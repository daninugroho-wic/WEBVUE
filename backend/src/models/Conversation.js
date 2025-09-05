const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
    platform: { type: String, enum: ['whatsapp', 'telegram', 'instagram'], required: true },
    contact_id: { type: String, required: true, maxlength: 100 }, 
    contact_name: { type: String, maxlength: 100 },
    whatsapp_id: { type: String, maxlength: 100 },
    telegram_id: { type: String, maxlength: 50 }, 
    instagram_id: { type: String, maxlength: 100 }, 
    last_message: { type: String, maxlength: 800 },
    last_message_time: { type: Date },
}, {
    timestamps: true,
});

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
