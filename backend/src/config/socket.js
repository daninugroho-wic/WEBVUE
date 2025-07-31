const { Server } = require("socket.io");
const { whatsappEvents } = require("./whatsapp");

const initializeSocket = (server) => {
  const io = new Server(server, { 
    cors: { 
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io connection
  io.on("connection", (socket) => {
    // console.log("✅ Frontend connected via socket:", socket.id);

    // Send connection confirmation
    socket.emit("connection-status", {
      status: "connected",
      message: "Socket connection established"
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // console.log("❌ Frontend disconnected:", socket.id);
    });
  });

  // Emit pesan baru ke semua client
  function emitNewMessage(message) {
    console.log("📡 Broadcasting new message to all clients:", {
      sender: message.sender_id,
      text: message.text?.substring(0, 50) + "..."
    });
    io.emit("new-message", message);
  }

  // Emit pesan terkirim ke semua client
  function emitMessageSent(message) {
    console.log("📡 Broadcasting sent message to all clients");
    io.emit("message-sent", message);
  }

  // Listen event dari WhatsApp dan emit via socket.io
  whatsappEvents.on("new-message", (message) => {
    console.log("📨 Pesan baru dari WhatsApp, kirim ke frontend");
    emitNewMessage(message);
  });

  whatsappEvents.on("message-sent", (message) => {
    console.log("📤 Pesan terkirim dari WhatsApp, kirim ke frontend");
    emitMessageSent(message);
  });

  return io;
};

module.exports = initializeSocket;
