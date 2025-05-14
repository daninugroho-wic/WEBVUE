const mongoose = require('mongoose');

const CompanyPhoneSchema = new mongoose.Schema({
    phone_number: String,
    last_use: Date,
    entered_at: Date,
    description: String,
    name: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CompanyPhones", CompanyPhoneSchema);
