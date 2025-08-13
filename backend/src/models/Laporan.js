const mongoose = require('mongoose');

const LaporanSchema = new mongoose.Schema({
  cusName: { type: String, required: true, maxlength: 100 },
  cusPhone: { type: String, required: true, maxlength: 20 },
  cusLap: { type: String, required: true, maxlength: 500 },
  location: { type: String, required: true, maxlength: 200 },
  platform: { type: String, required: true, maxlength: 50 },
  team: { type: String, maxlength: 50 },
  status: { type: String, maxlength: 50 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Laporan', LaporanSchema);