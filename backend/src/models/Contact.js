const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    whatsappId: { type: String, required: true, unique: true }, // ID unik kontak WhatsApp, contoh: '6281234567890@c.us'
    name: { type: String },
    phoneNumber: { type: String },
    profilePicUrl: { type: String },
    lastSeen: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", ContactSchema);