// backend/models/User.js – ĐÃ CÓ FOLLOW SYSTEM HOÀN CHỈNH!!!
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", trim: true, maxlength: 500 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active"
    },
    // TÍNH NĂNG FOLLOW – SIÊU XỊN!!!
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // người theo dõi mình
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // mình đang theo dõi ai

    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);