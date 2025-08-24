const express = require("express");
const InstagramController = require("../controller/InstagramController");

const router = express.Router();

// Instagram session management
router.post("/sessions", InstagramController.createSession);
router.get("/sessions", InstagramController.getSessions);
router.delete("/sessions/:id", InstagramController.deleteSession);

// Instagram authentication
router.post("/login", InstagramController.login);
router.post("/logout", InstagramController.logout);

// Instagram messaging
router.get("/contacts", InstagramController.getContacts);
router.get("/messages", InstagramController.getMessages);
router.post("/send", InstagramController.sendMessage);

// Instagram status
router.get("/status", InstagramController.getStatus);

module.exports = router;