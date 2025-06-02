const mongoose = require('mongoose');

const InstagramSessionSchema = new mongoose.Schema({
  sessionData: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InstagramSession', InstagramSessionSchema);
