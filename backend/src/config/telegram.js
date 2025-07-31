// config/telegram.js
const { Telegraf } = require('telegraf');
const bot = new Telegraf('8109328380:AAGcORY0ZdYM3NiHrQ5izGYwLB86vCLsey8'); // Ganti dengan token baru
class TelegramService {
    constructor() {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        this.setupBot();
    }

    setupBot() {
        // Welcome message
        this.bot.start((ctx) => {
            ctx.reply('🤖 Halo! Saya bot helpdesk siap membantu Anda.\n\nKetik /help untuk melihat perintah yang tersedia.');
        });

        // Help command
        this.bot.help((ctx) => {
            const helpText = `
🔧 *Perintah yang tersedia:*

/start - Memulai percakapan
/help - Menampilkan bantuan ini
/status - Mengecek status bot
/contact - Informasi kontak helpdesk

Kirim pesan apa saja dan kami akan membalas secepatnya! 💬
            `;
            ctx.reply(helpText, { parse_mode: 'Markdown' });
        });

        // Status command
        this.bot.command('status', (ctx) => {
            ctx.reply('✅ Bot aktif dan siap melayani!');
        });

        // Contact command
        this.bot.command('contact', (ctx) => {
            ctx.reply('📞 Kontak Helpdesk:\n\nEmail: support@company.com\nTelepon: +62-xxx-xxxx-xxxx');
        });

        // Handle all text messages
        this.bot.on('text', async (ctx) => {
            try {
                console.log(`📨 Pesan Telegram masuk dari ${ctx.from.first_name}: ${ctx.message.text}`);
                
                // Auto reply
                await ctx.reply(`Terima kasih atas pesan Anda: "${ctx.message.text}"\n\nPesan Anda telah diterima dan akan diproses oleh tim kami. 🙏`);
                
                // Forward to webhook handler jika diperlukan
                // Ini opsional jika menggunakan webhook
                
            } catch (error) {
                console.error('Error handling telegram message:', error);
                ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
            }
        });

        // Error handling
        this.bot.catch((err, ctx) => {
            console.error('Telegram bot error:', err);
        });
    }

    // Start bot dengan polling
    startBot() {
        this.bot.launch()
            .then(() => {
                console.log('✅ Telegram bot berhasil dijalankan');
                console.log(`🤖 Bot username: @${this.bot.botInfo.username}`);
            })
            .catch((err) => {
                console.error('❌ Error menjalankan Telegram bot:', err);
            });

        // Graceful shutdown
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    // Set webhook (untuk production)
    async setWebhook(url) {
        try {
            await this.bot.telegram.setWebhook(`${url}/api/telegram/webhook`);
            console.log('✅ Telegram webhook berhasil diatur');
        } catch (error) {
            console.error('❌ Error setting webhook:', error);
        }
    }

    // Send message method
    async sendMessage(chatId, message, options = {}) {
        try {
            const result = await this.bot.telegram.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                ...options
            });
            console.log(`📤 Pesan terkirim ke ${chatId}: ${message}`);
            return result;
        } catch (error) {
            console.error('Error sending telegram message:', error);
            throw error;
        }
    }

    // Get bot info
    async getBotInfo() {
        try {
            return await this.bot.telegram.getMe();
        } catch (error) {
            console.error('Error getting bot info:', error);
            throw error;
        }
    }

    // Stop bot
    stop() {
        this.bot.stop();
        console.log('🛑 Telegram bot dihentikan');
    }
}

module.exports = new TelegramService();