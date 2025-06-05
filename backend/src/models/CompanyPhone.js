const mongoose = require('mongoose');

const CompanyPhoneSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  last_use: { type: Date },
  entered_at: { type: Date },
  description: { type: String },
  name: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('CompanyPhone', CompanyPhoneSchema);




// digunakan untuk menyimpan nomor telepon perusahaan yang digunakan untuk WhatsApp Business API.