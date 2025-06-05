const { IgApiClient } = require('instagram-private-api');
const InstagramSession = require('../src/models/InstagramSession');

class InstagramService {
  constructor() {
    this.ig = new IgApiClient();
    this.loggedIn = false;
    this.challenge = null;
    this.sessionDoc = null;
    this.challengeOngoing = false; // Flag untuk log challenge hanya sekali
  }

  // Simpan session ke MongoDB
  async saveSession() {
    try {
      if (!this.sessionDoc) {
        this.sessionDoc = new InstagramSession({ sessionData: this.ig.state.serialize() });
      } else {
        this.sessionDoc.sessionData = this.ig.state.serialize();
        this.sessionDoc.updatedAt = new Date();
      }
      await this.sessionDoc.save();
      console.log('Instagram session disimpan ke database');
    } catch (error) {
      console.error('Gagal menyimpan session:', error);
    }
  }

  // Load session dari MongoDB
  async loadSession() {
    try {
      this.sessionDoc = await InstagramSession.findOne();
      if (this.sessionDoc && this.sessionDoc.sessionData) {
        await this.ig.state.deserialize(this.sessionDoc.sessionData);
        console.log('Instagram session dimuat dari database');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Gagal memuat session:', error);
      return false;
    }
  }

  // Login ke Instagram
  async login(username, password) {
    this.ig.state.generateDevice(username);

    const sessionExists = await this.loadSession();

    try {
      if (sessionExists) {
        await this.loginWithExistingSession();
      } else {
        await this.loginWithCredentials(username, password);
      }

      this.checkDMs(); // Cek DM setelah login berhasil
      return { success: true };
    } catch (e) {
      return this.handleLoginError(e);
    }
  }

  // Menggunakan session yang sudah ada jika valid
  async loginWithExistingSession() {
    try {
      await this.ig.account.currentUser();
      this.loggedIn = true;
      console.log('Instagram login berhasil menggunakan session yang sudah ada');
    } catch (err) {
      if (err.name === 'IgLoginRequiredError') {
        console.log('Session tidak valid, login ulang dengan username/password');
        await this.loginWithCredentials(username, password);
      } else {
        throw err;
      }
    }
  }

  // Login menggunakan username dan password
  async loginWithCredentials(username, password) {
    await this.ig.account.login(username, password);
    this.loggedIn = true;
    await this.saveSession();
    console.log('Instagram login berhasil dengan username/password');
  }

  // Menangani error saat login (termasuk checkpoint)
  async handleLoginError(e) {
    if (e.name === 'IgCheckpointError') {
      this.challenge = e.response.body.challenge;
      console.log('Challenge Required:', this.challenge);
      return { success: false, challenge: this.challenge };
    }
    throw e;
  }

  // Pilih metode challenge (sms/email)
  async selectChallengeMethod(method) {
    if (!this.challenge) throw new Error('Tidak ada challenge untuk diselesaikan');
    await this.ig.challenge.selectVerifyMethod(method);
  }

  // Kirim kode challenge yang didapat user
  async sendChallengeCode(code) {
    try {
      await this.ig.challenge.sendSecurityCode(code);
      this.loggedIn = true;
      this.challenge = null;
      await this.saveSession();
      console.log('Challenge berhasil diselesaikan, login selesai');
      this.checkDMs(); // Cek DM setelah berhasil login
    } catch (error) {
      console.error('Gagal mengirim kode challenge:', error);
    }
  }

  // Polling untuk cek DM dengan flag log challenge sekali saja
  async checkDMs() {
    if (!this.loggedIn) return;

    setInterval(async () => {
      try {
        const inbox = await this.ig.feed.directInbox().items();
        inbox.forEach(thread => {
          console.log(`Pesan DM dari ${thread.thread_id}: ${thread.last_permanent_item.text}`);
        });

        if (this.challengeOngoing) {
          this.challengeOngoing = false;
          console.log('Challenge sudah selesai, polling dilanjutkan normal.');
        }
      } catch (err) {
        this.handleDMsError(err);
      }
    }, 5000);
  }

  // Penanganan error saat memeriksa DM
  async handleDMsError(err) {
    if (err.name === 'IgCheckpointError') {
      if (!this.challengeOngoing) {
        this.challengeOngoing = true;
        console.error('Challenge Required saat cek DM:', err.response.body.challenge);
      }
      // Abaikan log challenge selanjutnya agar tidak spam terminal
    } else {
      console.error('Gagal mengambil DM Instagram:', err);
    }
  }

  // Kirim DM ke user tertentu
  async sendDM(userId, message) {
    try {
      await this.ig.directThread(userId).broadcastText(message);
      console.log(`Pesan DM terkirim ke ${userId}`);
    } catch (err) {
      console.error('Gagal mengirim pesan DM:', err);
    }
  }
}

module.exports = new InstagramService();
