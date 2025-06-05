const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
    {
        sender: { type: String, required: true, },
        receiver: { type: String, required: true, },
        last_message: { type: String, required: true, },
        unread_count: { type: Number, default: 0, },
        updated_at: { type: Date, default: Date.now, },
    },
    {
        timestamps: true,
    }
);


ConversationSchema.index({ contact_number: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);




// hanya menyimpan metadata tentang percakapan, yaitu informasi siapa pengirim dan penerima di percakapan itu, 
// Jadi model ini berfungsi sebagai “wadah” untuk mengelompokkan pesan-pesan yang saling terkait antara dua pihak.