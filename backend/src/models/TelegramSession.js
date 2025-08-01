const mongoose = require('mongoose');

const TelegramSessionSchema = new mongoose.Schema({
  bot_token: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    match: [/^\d{8,10}:[a-zA-Z0-9_-]{35}$/, 'Harap masukkan bot token yang valid'],
    index: true 
  },
  description: { type: String, default: '', maxlength: 255 }
}, {
  timestamps: true,
});

module.exports = mongoose.model('TelegramSession', TelegramSessionSchema);