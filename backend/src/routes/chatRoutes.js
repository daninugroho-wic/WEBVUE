const express = require("express");
const chatController = require("../controller/ChatController");

const router = express.Router();

// WhatsApp specific routes
router.post("/send-message", chatController.sendMessage);
router.get("/receive-message", chatController.getReceivedMessages);

// API routes with /api prefix
router.get("/api/messages", chatController.getMessagesBySender);
router.get("/api/contacts", chatController.contacts);
router.post("/api/contacts", chatController.saveContact);
router.get("/api/whatsapp/status", chatController.getWhatsAppStatus);

module.exports = router;