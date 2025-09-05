const mongoose = require('mongoose');

const WhatsAppSessionSchema = new mongoose.Schema({
  phone_number: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    maxlength: 25, 
    match: [/^\+?[1-9]\d{1,14}$/, 'Harap masukkan nomor telepon yang valid'], 
    index: true 
  },
  description: { type: String, default: '', maxlength: 255 }
}, {
  timestamps: true,
});

module.exports = mongoose.model('WhatsAppSession', WhatsAppSessionSchema);