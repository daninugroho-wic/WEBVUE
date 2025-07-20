// config/telegram.js
const { Telegraf } = require('telegraf');

class TelegramService {
  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }

  startBot() {
    this.bot.start((ctx) => ctx.reply('Halo! Saya bot helpdesk siap membantu.'));
    this.bot.help((ctx) => ctx.reply('Kirim pesan apa saja, saya akan membalas.'));
    
    // Event listener untuk pesan teks masuk
    this.bot.on('text', (ctx) => {
      console.log(`Pesan Telegram diterima: ${ctx.message.text}`);
      ctx.reply(`Kamu berkata: ${ctx.message.text}`);
    });

    this.bot.launch()
      .then(() => console.log('Telegram bot berjalan...'))
      .catch((err) => console.error('Error menjalankan Telegram bot:', err));
  }

  sendMessage(chatId, message) {
    return this.bot.telegram.sendMessage(chatId, message);
  }
}

module.exports = new TelegramService();