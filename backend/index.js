require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Import services & routes
const { initializeWhatsApp, whatsappEvents } = require("./config/whatsapp");
const instagramService = require("./config/instagram");
const telegramService = require("./config/telegram");
const authRoutes = require("./src/routes/authRoutes");
const chatController = require("./src/controller/ChatController");
const laporanRoutes = require("./src/routes/laporanRoutes");

// Inisialisasi app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Frontend connected via socket:", socket.id);
});

// Emit pesan baru ke semua client
function emitNewMessage(message) {
  io.emit("new-message", message);
}

// Listen event dari WhatsApp dan emit via socket.io
whatsappEvents.on("new-message", (message) => {
  console.log("Pesan baru dari WhatsApp, kirim ke frontend:", message);
  emitNewMessage(message);
});

// Koneksi MongoDB dan mulai server
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatvue", {})
  .then(() => {
    console.log("Koneksi ke MongoDB berhasil");

    // Inisialisasi layanan eksternal
    initializeWhatsApp();
    instagramService
      .login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
      .then((result) => {
        if (result.success) console.log("Instagram siap untuk menerima DM.");
      })
      .catch((err) => console.error("Login Instagram gagal:", err));
    telegramService.startBot();

    // API Chat & User routes
    app.post("/send-message", chatController.sendMessage);
    app.get("/receive-message", chatController.getReceivedMessages);
    app.get("/api/messages", chatController.messages);
    app.get("/api/contacts", chatController.contacts);
    app.post("/api/contacts", chatController.saveContact);
    app.post("/api/messages", chatController.newMessage);
    app.post("/api/users", chatController.getAllUsers);
    app.post("/api/company-phones", chatController.companyPhone);
    app.post("/api/conversations", chatController.conversation);
    app.get("/api/conversations", chatController.saveConversation);

    
    // authRoutes.js
    app.use('/api', laporanRoutes);
    app.use("/api/auth", authRoutes);

    // Telegram send message
    app.post("/api/telegram/send", async (req, res) => {
      const { chatId, message } = req.body;
      if (!chatId || !message)
        return res.status(400).json({ error: "chatId dan message diperlukan" });
      try {
        await telegramService.sendMessage(chatId, message);
        res.json({ status: "Pesan Telegram terkirim" });
      } catch (err) {
        res.status(500).json({ error: "Gagal mengirim pesan Telegram" });
      }
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("Gagal koneksi ke MongoDB:", err));