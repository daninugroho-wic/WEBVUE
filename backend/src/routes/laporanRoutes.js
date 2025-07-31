const express = require('express');
const router = express.Router();
const LaporanController = require('../controller/LaporanController');

// Hapus '/laporan' dari route karena sudah ada di prefix index.js
router.get('/', LaporanController.getAllLaporan);
router.get('/:id', LaporanController.getLaporanById);
router.post('/', LaporanController.createLaporan);
router.put('/:id', LaporanController.updateLaporan);
router.delete('/:id', LaporanController.deleteLaporan);

module.exports = router;