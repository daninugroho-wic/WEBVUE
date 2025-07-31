const Laporan = require('../models/Laporan');

exports.getAllLaporan = async (req, res) => {
  try {
    const laporans = await Laporan.find().sort({ createdAt: -1 });
    res.json(laporans);
  } catch (err) {
    console.error('Error getAllLaporan:', err);
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await Laporan.findById(id);
    
    if (!laporan) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }
    
    res.json(laporan);
  } catch (err) {
    console.error('Error getLaporanById:', err);
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
};

exports.createLaporan = async (req, res) => {
  try {
    const laporan = new Laporan(req.body);
    await laporan.save();
    res.status(201).json({ 
      message: 'Laporan berhasil disimpan',
      data: laporan 
    });
  } catch (err) {
    console.error('Error createLaporan:', err);
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
};

exports.updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await Laporan.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!laporan) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }
    
    res.json({ 
      message: 'Laporan berhasil diupdate',
      data: laporan 
    });
  } catch (err) {
    console.error('Error updateLaporan:', err);
    res.status(500).json({ error: 'Gagal mengupdate laporan' });
  }
};

exports.deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await Laporan.findByIdAndDelete(id);
    
    if (!laporan) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }
    
    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (err) {
    console.error('Error deleteLaporan:', err);
    res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
};