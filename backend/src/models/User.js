const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    role: { type: String, required: true, maxlength: 20 },
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 100 },
    password: { type: String, required: true, minlength: 6, maxlength: 255 },
    alamat: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: ['On', 'Off'], default: 'On' },
    lastLogin: { type: Date },
}, {
    timestamps: true,
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password for login
UserSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);