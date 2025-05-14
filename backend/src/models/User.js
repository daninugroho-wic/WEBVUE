const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    role: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
