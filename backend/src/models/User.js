const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true, },
    role: { type: String, enum: ['admin', 'helpdesk'], required: true, },
    isActive: { type: Boolean, default: true, },
    lastLogin: { type: Date, },
    createdAt: { type: Date, default: Date.now, },
    updatedAt: { type: Date, default: Date.now },
});

// Middleware update updatedAt secara otomatis saat simpan
UserSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', UserSchema);

// Model User ini digunakan untuk menyimpan informasi pengguna yang dapat mengakses sistem,