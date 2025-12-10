const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // đường dẫn đúng

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");

    // 👑 Tạo tài khoản admin mặc định nếu chưa có
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("123", 10);
      await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("👑 Admin account created: admin@gmail.com / 123");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
