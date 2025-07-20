const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: String },
    receiver_id: { type: String },
    messageType: { type: String, enum: ['text', 'status', 'media'], default: 'text' },
    messageSource: { type: String, enum: ['user', 'status'], default: 'user' },
    text: { type: String },
    status: { type: String, enum: ['sent', 'received', 'read'], default: 'received' },
    send_by: { type: String, enum: ['system', 'user'], default: 'system' },
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Message", MessageSchema);
