const express = require("express");
const whatsappController = require("../controller/WhatsappController"); // ✅ Updated import

const router = express.Router();

// WhatsApp specific routes
router.post("/send-message", whatsappController.sendMessage);
router.get("/receive-message", whatsappController.getReceivedMessages);

// API routes with /api prefix
router.get("/api/messages", whatsappController.getMessagesBySender);
router.get("/api/conversations", whatsappController.getConversations);
router.post("/api/conversations", whatsappController.saveConversation);
router.get("/api/whatsapp/status", whatsappController.getWhatsAppStatus);

// ✅ New WhatsApp session management routes
router.get("/api/whatsapp/sessions", whatsappController.getWhatsAppSessions);
router.post("/api/whatsapp/sessions", whatsappController.saveWhatsAppSession);

// Legacy endpoints (untuk backward compatibility)
router.get("/api/contacts", whatsappController.getConversations);
router.post("/api/contacts", whatsappController.saveConversation);

module.exports = router;