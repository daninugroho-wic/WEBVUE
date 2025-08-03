const mongoose = require('mongoose');

const LaporanSchema = new mongoose.Schema({
  cusName: String,
  cusPhone: String,
  cusLap: String,
  location: String,
  platform: String,
  team: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Laporan', LaporanSchema);