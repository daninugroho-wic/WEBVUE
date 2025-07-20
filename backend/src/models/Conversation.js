const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
    {
        sender: { type: String, required: true },
        receiver: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

ConversationSchema.index({ contact_number: 1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
