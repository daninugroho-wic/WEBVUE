const { initializeWhatsApp } = require("./whatsapp");
const instagramService = require("./instagram");
const telegramService = require("./telegram");

const initializeServices = () => {
  // Inisialisasi layanan eksternal
  initializeWhatsApp();
  
  instagramService
    .login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
    .then((result) => {
      if (result.success) console.log("Instagram siap untuk menerima DM.");
    })
    .catch((err) => console.error("Login Instagram gagal:", err));
  
  telegramService.startBot();
};

module.exports = initializeServices;

// fungsi ini digunakan untuk menginisialisasi layanan eksternal seperti WhatsApp, Instagram, dan Telegram