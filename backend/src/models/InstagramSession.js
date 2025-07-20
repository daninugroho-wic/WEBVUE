const mongoose = require("mongoose");

const InstagramSessionSchema = new mongoose.Schema({
  sessionData: { type: Object, required: true },
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InstagramSession", InstagramSessionSchema);
