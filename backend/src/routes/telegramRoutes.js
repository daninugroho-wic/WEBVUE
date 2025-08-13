const express = require('express');
const router = express.Router();
const TelegramController = require('../controller/TelegramController');

// Webhook endpoint (harus sebelum routes lain)
router.post('/webhook/:token', TelegramController.webhook);

// Session management
router.post('/sessions', TelegramController.createSession);
router.get('/sessions', TelegramController.getSessions);
router.delete('/sessions/:id', TelegramController.deleteSession);

// Message handling
router.get('/contacts', TelegramController.getContacts);
router.post('/send', TelegramController.sendMessage);
router.get('/incoming-messages', TelegramController.getIncomingMessages);
router.get('/messages', TelegramController.getMessages);

module.exports = router;