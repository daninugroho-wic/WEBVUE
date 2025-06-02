const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  sender: { type: String, required: true },         // Nomor pengirim (user/contact)
  receiver: { type: String, required: true },       // Nomor penerima (biasanya nomor perusahaan/akun WA)
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Middleware pre-save untuk update `updated_at` setiap kali dokumen disimpan
ConversationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index untuk pencarian cepat berdasarkan sender
ConversationSchema.index({ sender: 1 });

// Jika ingin unique conversation per pasangan sender-receiver
ConversationSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
