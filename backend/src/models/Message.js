const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation_id: mongoose.Schema.Types.ObjectId,
    text: String,
    message: String,
    status: { type: String, default: "sent" },
    send_by: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);