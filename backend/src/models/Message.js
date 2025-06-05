const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: String, },
    receiver_id: { type: String, },
    messageType: { type: String, default: 'text' },
    text: { type: String },
    status: { type: String, enum: ['sent', 'received', 'read'], default: 'received' },
    send_by: { type: String, enum: ['system', 'user'], default: 'system' },
    timestamp: { type: Date, default: Date.now },
});
  

module.exports = mongoose.model("Message", MessageSchema);