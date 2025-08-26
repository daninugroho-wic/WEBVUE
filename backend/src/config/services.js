const { initializeWhatsApp } = require("./whatsapp");
const telegramService = require("./telegram");
const instagramService = require("./instagram");

// ==================== SERVICE INITIALIZATION ====================

/**
 * Initialize all external messaging services
 * Services akan tetap jalan meskipun ada yang error
 */
const initializeServices = async () => {
  console.log("🚀 Starting services initialization...");

  // Initialize WhatsApp
  try {
    console.log("📱 Initializing WhatsApp...");
    initializeWhatsApp();
  } catch (error) {
    console.error("❌ WhatsApp initialization failed:", error.message);
  }

  // Initialize Telegram
  try {
    console.log("🤖 Initializing Telegram...");
    await telegramService.initializeFromEnv();
  } catch (error) {
    console.error("❌ Telegram initialization failed:", error.message);
  }

  // Initialize Instagram
  try {
    console.log("📸 Initializing Instagram...");
    if (instagramService.loginInstagram) {
      await instagramService.loginInstagram();
    }
    if (instagramService.startDMListener) {
      instagramService.startDMListener();
    }
  } catch (error) {
    console.error("❌ Instagram initialization failed:", error.message);
  }

  console.log("✅ Services initialization completed");
};

// ==================== EXPORTS ====================
module.exports = initializeServices;

// fungsi ini digunakan untuk menginisialisasi layanan eksternal seperti WhatsApp, Instagram, dan Telegram