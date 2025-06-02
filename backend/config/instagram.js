// config/instagram.js
const { IgApiClient } = require('instagram-private-api');
const InstagramSession = require('../src/models/InstagramSession');

class InstagramService {
  constructor() {
    this.ig = new IgApiClient();
    this.loggedIn = false;
    this.challenge = null;
    this.sessionDoc = null;
    this.challengeOngoing = false; // flag challenge agar log hanya sekali
  }

  // Simpan session ke MongoDB
  async saveSession() {
    if (!this.sessionDoc) {
      this.sessionDoc = new InstagramSession({ sessionData: this.ig.state.serialize() });
    } else {
      this.sessionDoc.sessionData = this.ig.state.serialize();
      this.sessionDoc.updatedAt = new Date();
    }
    await this.sessionDoc.save();
    console.log('Instagram session disimpan ke database');
  }

  // Load session dari MongoDB
  async loadSession() {
    this.sessionDoc = await InstagramSession.findOne();
    if (this.sessionDoc && this.sessionDoc.sessionData) {
      await this.ig.state.deserialize(this.sessionDoc.sessionData);
      console.log('Instagram session dimuat dari database');
      return true;
    }
    return false;
  }

  // Login ke Instagram dengan fallback session dan challenge handling
  async login(username, password) {
    this.ig.state.generateDevice(username);

    const sessionExists = await this.loadSession();

    try {
      if (sessionExists) {
        try {
          await this.ig.account.currentUser();
          this.loggedIn = true;
          console.log('Instagram login berhasil (pakai session tersimpan)');
        } catch (err) {
          if (err.name === 'IgLoginRequiredError') {
            console.log('Session tidak valid, login ulang dengan username/password');
            await this.ig.account.login(username, password);
            this.loggedIn = true;
            await this.saveSession();
            console.log('Instagram login berhasil (setelah relogin)');
          } else {
            throw err;
          }
        }
      } else {
        await this.ig.account.login(username, password);
        this.loggedIn = true;
        await this.saveSession();
        console.log('Instagram login berhasil (baru)');
      }

      this.checkDMs();
      return { success: true };
    } catch (e) {
      if (e.name === 'IgCheckpointError') {
        this.challenge = e.response.body.challenge;
        console.log('Challenge Required:', this.challenge);
        return { success: false, challenge: this.challenge };
      }
      throw e;
    }
  }

  // Pilih metode challenge (sms/email)
  async selectChallengeMethod(method) {
    if (!this.challenge) throw new Error('Tidak ada challenge untuk diselesaikan');
    await this.ig.challenge.selectVerifyMethod(method);
  }

  // Kirim kode challenge yang didapat user
  async sendChallengeCode(code) {
    await this.ig.challenge.sendSecurityCode(code);
    this.loggedIn = true;
    this.challenge = null;
    await this.saveSession();
    console.log('Challenge berhasil diselesaikan, login selesai');
    this.checkDMs();
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
        if (err.name === 'IgCheckpointError') {
          if (!this.challengeOngoing) {
            this.challengeOngoing = true;
            console.error('Challenge Required saat cek DM:', err.response.body.challenge);
          }
          // abaikan log selanjutnya agar tidak spam terminal
        } else {
          console.error('Gagal mengambil DM Instagram:', err);
        }
      }
    }, 5000);
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
