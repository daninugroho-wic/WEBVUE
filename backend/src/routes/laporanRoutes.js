const express = require('express');
const router = express.Router();
const LaporanController = require('../controller/LaporanController');

router.post('/laporan', LaporanController.createLaporan);
router.get('/laporan', LaporanController.getAllLaporan);

module.exports = router;