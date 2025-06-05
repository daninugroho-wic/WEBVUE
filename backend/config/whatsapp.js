const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

const Message = require('../src/models/Message');
const Conversation = require('../src/models/Conversation');
const CompanyPhone = require('../src/models/CompanyPhone');
const User = require('../src/models/User');

const MAX_RESTART_ATTEMPTS = 5;
let restartAttempts = 0;

class WhatsappEmitter extends EventEmitter {}
const whatsappEvents = new WhatsappEmitter();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    timeout: 60000,
  },
});

async function restartClient() {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('Batas maksimal restart client tercapai, butuh intervensi manual.');
    return;
  }

  restartAttempts++;
  console.log(`Restart WhatsApp Client, percobaan ke-${restartAttempts}...`);

  try {
    await client.destroy();
    await client.initialize();
  } catch (error) {
    console.error('Gagal restart client:', error);
    setTimeout(restartClient, 5000);
  }
}

async function ensureDefaultCompanyPhone() {
  const defaultNumber = "085156275875";

  try {
    const existing = await CompanyPhone.findOne({ phone_number: defaultNumber });
    if (!existing) {
      await new CompanyPhone({
        phone_number: defaultNumber,
        description: "Default WhatsApp Phone",
        name: "Default",
      }).save();
      console.log("Nomor default perusahaan berhasil disimpan");
    }
  } catch (error) {
    console.error('Gagal menyimpan nomor default perusahaan:', error);
  }
}

async function handleIncomingMessage(message) {
  if (!message.body) return;
  if (!client.info || !client.info.wid) {
    console.warn('Client belum siap, abaikan pesan masuk');
    return;
  }

  try {
    let conversation = await Conversation.findOne({
      sender: message.from,
      receiver: client.info.wid._serialized,
    });

    if (!conversation) {
      conversation = await new Conversation({
        sender: message.from,
        receiver: client.info.wid._serialized,
      }).save();
      console.log('Percakapan baru dibuat:', conversation._id);
    }

    const newMessage = new Message({
      conversation_id: conversation._id,
      text: message.body,
      sender_id: message.from,
      receiver_id: client.info.wid._serialized,
      status: 'received',
      send_by: 'user',
      timestamp: message.timestamp || Date.now(),
    });

    await newMessage.save();

    console.log(`Pesan dari ${message.from} berhasil disimpan: "${message.body}"`);

    // Emit event pesan baru
    whatsappEvents.emit('new-message', {
      message_id: newMessage._id.toString(),
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      text: newMessage.text,
      timestamp: newMessage.timestamp,
      platform: 'whatsapp',
    });

    // Jika perlu membalas pesan
    // await sendReply(message.from, 'Terima kasih telah menghubungi kami!');

  } catch (error) {
    if (error.message.includes('Execution context was destroyed')) {
      console.warn('Eksekusi gagal karena context hilang, abaikan dan tunggu reconnect');
    } else {
      console.error('Gagal menyimpan pesan masuk:', error);
    }
  }
}

// Fungsi untuk mengirim balasan ke pengirim
async function sendReply(sender, replyText) {
  try {
    // Mengirim pesan balasan ke pengirim
    await client.sendMessage(sender, replyText);
    console.log(`Balasan berhasil dikirim ke ${sender}`);

    // Simpan pesan balasan ke database
    const conversation = await Conversation.findOne({
      sender: sender,
      receiver: client.info.wid._serialized,
    });

    const newMessage = new Message({
      conversation_id: conversation._id,
      text: replyText,
      sender_id: client.info.wid._serialized,
      receiver_id: sender,
      status: 'sent',
      send_by: 'system',
      timestamp: Date.now(),
    });

    await newMessage.save();
    console.log(`Pesan balasan ke ${sender} berhasil disimpan: "${replyText}"`);

    // Update percakapan terakhir dengan pesan balasan
    conversation.lastMessage = replyText;
    await conversation.save();

  } catch (error) {
    console.error('Gagal mengirim pesan balasan:', error);
  }
}

function initializeWhatsApp() {
  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code dibuat. Silakan scan WhatsApp di ponsel Anda.');
  });

  client.on('ready', async () => {
    console.log('WhatsApp Client siap digunakan!');
    restartAttempts = 0;

    try {
      const userCount = await User.countDocuments();
      console.log(`Total pengguna terdaftar: ${userCount}`);
    } catch (error) {
      console.error('Gagal ambil data pengguna:', error);
    }

    await ensureDefaultCompanyPhone();
  });

  client.on('authenticated', () => console.log('WhatsApp terautentikasi.'));

  client.on('auth_failure', () => {
    console.warn('Autentikasi gagal, mencoba restart...');
    restartClient();
  });

  client.on('disconnected', (reason) => {
    console.warn('WhatsApp Client terputus:', reason);
    setTimeout(restartClient, 10000);
  });

  client.on('error', (error) => console.error('Error WhatsApp Client:', error));

  client.on('message', handleIncomingMessage);

  client.initialize();
}

module.exports = { client, initializeWhatsApp, whatsappEvents };
