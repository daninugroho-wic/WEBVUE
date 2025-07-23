const User = require('../models/User');

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Username tidak ditemukan" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Password salah" });

    // Contoh: kirim role dan token (token dummy, ganti dengan JWT jika perlu)
    res.json({
      token: "dummy-token",
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal login" });
  }
};

const register = async (req, res) => {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }
    try {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: "Username sudah terdaftar" });

      const user = new User({ username, password, email, role });
      await user.save();
      res.status(201).json({ message: "Registrasi berhasil" });
    } catch (err) {
      res.status(500).json({ error: "Gagal register" });
    }
};

module.exports = {
  register,
  login,
};