const mongoose = require("mongoose");

const InstagramSessionSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 30, match: [/^[a-zA-Z0-9._]{1,30}$/, "Harap masukkan username Instagram yang valid"], index: true },
  description: { type: String, default: "", maxlength: 255 },
}, {
  timestamps: true,
});

module.exports = mongoose.model("InstagramSession", InstagramSessionSchema);
