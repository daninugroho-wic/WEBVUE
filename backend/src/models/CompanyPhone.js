const mongoose = require('mongoose');

const CompanyPhoneSchema = new mongoose.Schema({
  phone_number: { type: String, required: true, unique: true, trim: true, match: [/^\+?[1-9]\d{1,14}$/, 'Harap masukkan nomor telepon yang valid']},
  last_use: { type: Date },
  entered_at: { type: Date, default: Date.now },  // Secara otomatis di-set ke tanggal sekarang jika tidak diberikan
  description: { type: String, default: '' },
  name: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('CompanyPhone', CompanyPhoneSchema);


// digunakan untuk menyimpan nomor telepon perusahaan yang digunakan untuk WhatsApp Business API.