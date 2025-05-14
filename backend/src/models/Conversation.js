const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Conversation", ConversationSchema);
