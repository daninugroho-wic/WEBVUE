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

    // Update lastLogin
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.json({
      token: "dummy-token",
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal login" });
  }
};

const register = async (req, res) => {
  const { username, password, email, role, alamat, status, confirmPassword } = req.body;
  
  // Validasi sederhana dalam satu blok
  if (!username || !password || !email || !role) {
    return res.status(400).json({ error: "Field yang bertanda * wajib diisi" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter" });
  }
  
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: "Password dan konfirmasi password tidak cocok" });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }
  
  try {
    // Check username dan email exists dalam satu query
    const existing = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });
    
    if (existing) {
      if (existing.username === username.trim()) {
        return res.status(400).json({ error: "Username sudah terdaftar" });
      }
      if (existing.email === email.trim().toLowerCase()) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }
    }

    const user = new User({ 
      username: username.trim(), 
      password, 
      email: email.trim().toLowerCase(), 
      role,
      alamat: alamat || '',
      status: status || 'On'
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: "Registrasi berhasil",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        alamat: user.alamat,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: "Gagal register: " + err.message });
  }
};

// Tambahkan fungsi untuk mengambil semua users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: "Gagal mengambil data users" });
  }
};

// Tambahkan fungsi untuk delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: "Gagal menghapus user" });
  }
};

// Tambahkan fungsi untuk update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, alamat, status } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, role, alamat, status },
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    
    res.json({ 
      message: "User berhasil diupdate",
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: "Gagal mengupdate user" });
  }
};

// Tambahkan fungsi untuk login history
const getLoginHistory = async (req, res) => {
  try {
    const users = await User.find({ lastLogin: { $exists: true } }, '-password')
      .sort({ lastLogin: -1 })
      .limit(10);
    
    const loginHistory = users.map(user => ({
      _id: user._id,
      username: user.username,
      role: user.role,
      loginTime: user.lastLogin
    }));
    
    res.json(loginHistory);
  } catch (err) {
    console.error('Get login history error:', err);
    res.status(500).json({ error: "Gagal mengambil riwayat login" });
  }
};

// Tambahkan fungsi untuk recent users
const getRecentUsers = async (req, res) => {
  try {
    const recentUsers = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const formattedUsers = recentUsers.map(user => ({
      _id: user._id,
      username: user.username,
      role: user.role,
      loginTime: user.createdAt, // Menggunakan createdAt sebagai "login time"
      status: user.status
    }));
    
    res.json(formattedUsers);
  } catch (err) {
    console.error('Get recent users error:', err);
    res.status(500).json({ error: "Gagal mengambil data recent users" });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  deleteUser,
  updateUser,
  getLoginHistory, // Tambahkan ini
  getRecentUsers, // Tambahkan ini
};