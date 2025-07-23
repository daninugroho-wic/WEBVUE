const Laporan = require('../models/Laporan');

exports.getAllLaporan = async (req, res) => {
  try {
    const laporans = await Laporan.find().sort({ createdAt: -1 });
    res.json(laporans);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
};

exports.createLaporan = async (req, res) => {
  try {
    const laporan = new Laporan(req.body);
    await laporan.save();
    res.status(201).json({ message: 'Laporan berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
};