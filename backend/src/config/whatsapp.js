const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Contact = require('../models/Contact');
const CompanyPhone = require('../models/CompanyPhone');

const MAX_RESTART_ATTEMPTS = 5;
let restartAttempts = 0;

class WhatsappEmitter extends EventEmitter {}
const whatsappEvents = new WhatsappEmitter();

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-helpdesk"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection'
    ],
    timeout: 60000,
  },
});

// ----------------- Helper Functions -----------------

// Restart client dengan retry logic
async function restartClient() {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('❌ Batas maksimal restart client tercapai, butuh intervensi manual.');
    return;
  }

  restartAttempts++;
  console.log(`🔄 Restart WhatsApp Client, percobaan ke-${restartAttempts}...`);

  try {
    await client.destroy();
    setTimeout(() => {
      client.initialize();
    }, 5000);
  } catch (error) {
    console.error('❌ Gagal restart client:', error);
    setTimeout(restartClient, 10000);
  }
}

// Simpan nomor perusahaan
async function ensureDefaultCompanyPhone() {
  try {
    if (!client.info || !client.info.wid) return;

    let companyPhoneNumber = client.info.wid._serialized.replace('@c.us', '');

    const existing = await CompanyPhone.findOne({ phone_number: companyPhoneNumber });
    if (!existing) {
      const newCompanyPhone = new CompanyPhone({
        phone_number: companyPhoneNumber,
        description: "Default WhatsApp Phone",
      });
      await newCompanyPhone.save();
      console.log("✅ Nomor perusahaan berhasil disimpan:", companyPhoneNumber);
    }
  } catch (error) {
    console.error('❌ Gagal menyimpan nomor perusahaan:', error);
  }
}

// Simpan atau update kontak
async function saveOrUpdateContact(contactId, contactInfo = {}) {
  try {
    let contact = await Contact.findOne({ whatsappId: contactId });
    
    if (!contact) {
      // Buat kontak baru
      contact = new Contact({
        whatsappId: contactId,
        name: contactInfo.name || contactInfo.pushname || null,
        phoneNumber: contactId.replace('@c.us', ''),
        profilePicUrl: contactInfo.profilePicUrl || null,
        lastSeen: new Date()
      });
      await contact.save();
      console.log('✅ Kontak baru disimpan:', contactId);
    } else {
      // Update kontak yang sudah ada
      if (contactInfo.name || contactInfo.pushname) {
        contact.name = contactInfo.name || contactInfo.pushname;
      }
      contact.lastSeen = new Date();
      await contact.save();
      console.log('✅ Kontak diupdate:', contactId);
    }
    
    return contact;
  } catch (error) {
    console.error('❌ Gagal menyimpan/update kontak:', error);
    return null;
  }
}

// Handle pesan masuk dengan logic yang disempurnakan
async function handleIncomingMessage(message) {
  if (!message.body || !client.info || !client.info.wid) return;
  
  // Skip pesan dari diri sendiri
  if (message.from === client.info.wid._serialized) return;
  
  try {
    console.log('📨 Pesan masuk dari:', message.from, '| Isi:', message.body);

    // Simpan atau update kontak
    const contactInfo = await client.getContactById(message.from);
    await saveOrUpdateContact(message.from, {
      name: contactInfo.name,
      pushname: contactInfo.pushname
    });

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      sender: message.from,
      receiver: client.info.wid._serialized,
    });

    if (!conversation) {
      conversation = new Conversation({
        sender: message.from,
        receiver: client.info.wid._serialized,
      });
      await conversation.save();
      console.log('✅ Percakapan baru dibuat:', conversation._id);
    }

    // Tentukan tipe pesan
    let messageType = 'text';
    let messageSource = 'user';

    if (message.isStatus) {
      messageType = 'status';
      messageSource = 'status';
    } else if (message.hasMedia) {
      messageType = 'media';
    }

    // Simpan pesan ke database
    const newMessage = new Message({
      conversation_id: conversation._id,
      text: message.body,
      sender_id: message.from,
      receiver_id: client.info.wid._serialized,
      messageType: messageType,
      messageSource: messageSource, 
      status: 'received',           
      platform: 'whatsapp',         
      send_by: 'user',
    });

    await newMessage.save();
    console.log('✅ Pesan berhasil disimpan ke database');

    // Emit event untuk real-time update
    const messageData = {
      message_id: newMessage._id.toString(),
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      text: newMessage.text,
      timestamp: newMessage.createdAt,
      platform: 'whatsapp',
      messageType: newMessage.messageType,
      messageSource: newMessage.messageSource,
      status: 'received'
    };

    whatsappEvents.emit('new-message', messageData);
    // console.log('✅ Event new-message dipancarkan');

  } catch (error) {
    if (error.message.includes('Execution context was destroyed')) {
      console.warn('⚠️ Context hilang, skip pesan dan tunggu reconnect');
    } else {
      console.error('❌ Error handling pesan masuk:', error);
    }
  }
}

// Fungsi untuk mengirim pesan dengan validasi
async function sendWhatsAppMessage(phoneNumber, messageText, userId = 'system') {
  try {
    if (!client || !client.info) {
      throw new Error('WhatsApp client belum siap');
    }

    // Format nomor telepon
    let formattedNumber = phoneNumber;
    if (!phoneNumber.includes('@c.us')) {
      // Hapus karakter non-digit
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      formattedNumber = `${cleanNumber}@c.us`;
    }

    console.log('📤 Mengirim pesan ke:', formattedNumber, '| Isi:', messageText);

    // Kirim pesan
    const sentMessage = await client.sendMessage(formattedNumber, messageText);
    console.log('✅ Pesan WhatsApp terkirim');

    // Cari atau buat conversation
    let conversation = await Conversation.findOne({
      sender: formattedNumber,
      receiver: client.info.wid._serialized,
    });

    if (!conversation) {
      conversation = new Conversation({
        sender: formattedNumber,
        receiver: client.info.wid._serialized,
      });
      await conversation.save();
    }

    // Simpan pesan yang dikirim ke database
    const newMessage = new Message({
      conversation_id: conversation._id,
      text: messageText,
      sender_id: client.info.wid._serialized,
      receiver_id: formattedNumber,
      messageType: 'text',
      messageSource: 'user',      // pastikan sesuai enum
      status: 'sent',             // pastikan sesuai enum
      platform: 'whatsapp',       // WAJIB SESUAI ENUM
      send_by: userId === 'system' ? 'system' : 'user',
    });

    await newMessage.save();
    console.log('✅ Pesan terkirim disimpan ke database');

    // Emit event untuk real-time update
    const messageData = {
      message_id: newMessage._id.toString(),
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      text: newMessage.text,
      timestamp: newMessage.createdAt,
      platform: 'whatsapp',
      messageType: 'text',
      status: 'sent'
    };

    whatsappEvents.emit('message-sent', messageData);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Error mengirim pesan WhatsApp:', error);
    throw error;
  }
}

// ----------------- Initialize WhatsApp Client -----------------

function initializeWhatsApp() {
  console.log('🟡 Initializing WhatsApp Web...');

  // Event handlers
  client.on('qr', (qr) => {
    console.log('📱 Scan QR Code berikut dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('🔗 QR Code URL:', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp terautentikasi');
    restartAttempts = 0;
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp Client siap digunakan!');
    console.log('📱 Nomor aktif:', client.info.wid._serialized);
    
    await ensureDefaultCompanyPhone();
    
    // Test koneksi
    console.log('🔄 Testing WhatsApp connection...');
  });

  client.on('message', handleIncomingMessage);

  client.on('message_create', (message) => {
    // Handle pesan yang dibuat (termasuk pesan yang dikirim dari web)
    if (message.fromMe) {
      console.log('📤 Pesan terkirim dari web:', message.body);
    }
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Autentikasi gagal:', msg);
    setTimeout(() => {
      console.log('🔄 Mencoba restart client...');
      restartClient();
    }, 5000);
  });

  client.on('disconnected', (reason) => {
    console.warn('🔌 WhatsApp Client terputus:', reason);
    setTimeout(() => {
      console.log('🔄 Mencoba reconnect...');
      restartClient();
    }, 10000);
  });

  client.on('error', (error) => {
    console.error('❌ WhatsApp Client Error:', error);
  });

  // Initialize client
  client.initialize();
}

// Fungsi untuk mendapatkan status client
function getClientStatus() {
  return {
    isReady: client ? client.info !== undefined : false,
    isAuthenticated: client ? client.info !== null : false,
    phoneNumber: client && client.info ? client.info.wid._serialized : null
  };
}

module.exports = { 
  client, 
  initializeWhatsApp, 
  whatsappEvents, 
  sendWhatsAppMessage,
  getClientStatus
};