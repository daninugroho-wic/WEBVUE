const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  text: { type: String, required: true, maxlength: 800 },
  sender_id: { type: String, required: true, maxlength: 100 },
  receiver_id: { type: String, required: true, maxlength: 100 },
  status: { type: String, enum: ['sent', 'received'], default: 'sent' },
  platform: { type: String, required: true, enum: ['whatsapp', 'telegram', 'instagram'] },
  send_by: { type: String, maxlength: 100 },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Message', MessageSchema)