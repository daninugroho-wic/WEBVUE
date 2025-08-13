const { initializeWhatsApp } = require("./whatsapp");
const telegramService = require("./telegram");

// ==================== SERVICE INITIALIZATION ====================

/**
 * Initialize all external messaging services
 * Services akan tetap jalan meskipun ada yang error
 */
const initializeServices = async () => {
  console.log("🚀 Starting services initialization...");

  try {
    // Initialize WhatsApp
    console.log("📱 Initializing WhatsApp...");
    initializeWhatsApp();

    // Initialize Telegram
    console.log("🤖 Initializing Telegram...");
    await telegramService.initializeFromEnv();

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing services:", error.message);
    console.log("⚠️ Some services may not be available");
  }
};

// ==================== EXPORTS ====================
module.exports = initializeServices;

// fungsi ini digunakan untuk menginisialisasi layanan eksternal seperti WhatsApp, Instagram, dan Telegram