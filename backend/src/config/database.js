const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatvue", {});
    console.log("Koneksi ke MongoDB berhasil");
  } catch (err) {
    console.error("Gagal koneksi ke MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;