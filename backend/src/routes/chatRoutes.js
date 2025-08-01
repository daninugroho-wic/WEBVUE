const express = require("express");
const chatController = require("../controller/ChatController");

const router = express.Router();

// WhatsApp specific routes
router.post("/send-message", chatController.sendMessage);
router.get("/receive-message", chatController.getReceivedMessages);

// API routes with /api prefix (updated to use conversations)
router.get("/api/messages", chatController.getMessagesBySender);
router.get("/api/conversations", chatController.getConversations); // menggantikan /api/contacts
router.post("/api/conversations", chatController.saveConversation); // menggantikan /api/contacts
router.get("/api/whatsapp/status", chatController.getWhatsAppStatus);
router.put("/api/conversations/read/:conversationId", chatController.markAsRead); // endpoint baru

// Legacy endpoints (untuk backward compatibility)
router.get("/api/contacts", chatController.getConversations);
router.post("/api/contacts", chatController.saveConversation);

module.exports = router;