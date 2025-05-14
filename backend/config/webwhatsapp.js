const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Message = require('../src/models/Message.js');
const Conversation = require('../src/models/Conversation.js');
const CompanyPhone = require('../src/models/CompanyPhone.js');
const User = require('../src/models/User.js');

// Konfigurasi dan Inisialisasi Client

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

// Variabel untuk menyimpan pesan masuk dan nomor yang dikirimi pesan
let receivedMessage = [];

// Fungsi untuk Restart Client
function restartClient() {
    client
        .destroy()
        .then(() => client.initialize())
        .catch((error) => {
            console.error('Error saat restart client:', error);
            setTimeout(restartClient, 5000); // Coba ulang setelah 5 detik
        });
}

// Event Listener

// QR Code Generator
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code berhasil dibuat');
});

// Client Siap
client.on('ready', () => {
    console.log('WhatsApp Client siap digunakan!');
});

// Error Handling
client.on('error', (error) => {
    console.error('Error pada WhatsApp Client:', error);
});

// Autentikasi Gagal
client.on('auth_failure', () => {
    console.log('Autentikasi gagal. Mencoba ulang...');
    restartClient();
});

// Client Terputus
client.on('disconnected', (reason) => {
    console.log('WhatsApp Client terputus:', reason);
    restartClient();
});





// USER.JS
client.on('ready', async () => {
    try {
        const userCount = await User.countDocuments();
        console.log(`Total pengguna terdaftar: ${userCount}`);
    } catch (error) {
        console.error('Error mendapatkan data pengguna:', error);
    }
});

// COMPANYPHONE.JS
client.on('ready', async () => {
    const defaultPhone = new CompanyPhone({
        phone_number: "085156275875",
        description: "Default WhatsApp Phone",
        name: "Default",
    });

    try {
        await defaultPhone.save();
        console.log("Nomor default perusahaan berhasil disimpan");
    } catch (err) {
        console.error("Error menyimpan nomor default perusahaan:", err);
    }
});

// MESSAGE.JS & CONVERSATION.JS
client.on('message', async (message) => {
    const receiverId = client.info.wid._serialized; // Nomor WhatsApp Client

    // Simpan Pesan ke Database
    try {
        // Temukan atau buat percakapan terlebih dahulu
        let conversation = await Conversation.findOne({ sender: message.from, receiver: receiverId });

        if (!conversation) {
            conversation = new Conversation({
                sender: message.from,
                receiver: receiverId,
            });
            await conversation.save();
            console.log('Percakapan baru berhasil disimpan:', conversation);
        }

        const newMessage = new Message({
            conversation_id: conversation._id, // Hubungkan ke percakapan
            text: message.body,
            sender_id: message.from,
            receiver_id: receiverId, // Tambahkan receiver_id
            status: 'received',
            send_by: 'user', // Tambahkan send_by
        });

        await newMessage.save();
        console.log('Pesan masuk berhasil disimpan:', message.body);

    } catch (error) {
        console.error('Pesan masuk gagal disimpan:', error);
    }

    // Log Pesan Diterima
    console.log('Pesan diterima:', message.body);

    // Simpan ke Array `receivedMessage`
    receivedMessage.push({
        from: message.from,
        body: message.body,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
});


// Ekspor Module

module.exports = { client, receivedMessage };