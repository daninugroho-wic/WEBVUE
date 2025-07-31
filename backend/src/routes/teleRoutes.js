const express = require('express');
const router = express.Router();
const TelegramController = require('../controller/TelegramController');

// GET routes
router.get('/contacts', TelegramController.getContacts);
router.get('/messages', TelegramController.getMessages);
router.get('/incoming', TelegramController.getIncomingMessages);

// POST routes
router.post('/send', TelegramController.sendMessage);
router.post('/webhook', TelegramController.receiveMessage);

// PUT routes
router.put('/read/:conversation_id', TelegramController.markAsRead);

module.exports = router;