const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  text: String,
  sender_id: String,
  receiver_id: String,
  messageType: { type: String, enum: ['text', 'status', 'media'], default: 'text' },
  messageSource: { type: String, enum: ['user', 'system', 'status'], default: 'user' },
  status: { type: String, enum: ['sent', 'received'], default: 'sent' },
  platform: { type: String, required: true, enum: ['whatsapp', 'telegram', 'instagram'] }, // tambahkan 'telegram', 'instagram'
  send_by: String,
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Message', MessageSchema)