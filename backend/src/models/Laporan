const mongoose = require('mongoose');

const LaporanSchema = new mongoose.Schema({
  namaCustomer: String,
  noTelephone: String,
  laporanCustomer: String,
  lokasi: String,
  platform: String,
  team: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Laporan', LaporanSchema);