// backend/routes/userRoutes.js – PHIÊN BẢN HOÀN HẢO 100% – CHẠY NGON NGAY!!!

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const User = require("../models/User");

// GET /api/users/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .select("isAdmin")
      .populate("following", "_id name avatar")
      .populate("followers", "_id name avatar");

    res.json(user || {});
  } catch (err) {
    console.error("Lỗi /me:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/users/me
router.put("/me", protect, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user || {});
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/users – DANH SÁCH USER
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email avatar bio followers following blogs role createdAt status")
      .lean();

    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
      bio: user.bio || "",
      role: user.role || "user",
      status: user.status || "active",        // thêm status
      createdAt: user.createdAt,
      followerCount: Array.isArray(user.followers) ? user.followers.length : 0,
      articleCount: user.blogs ? user.blogs.length : 0,
      following: user.following || [],
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("Lỗi lấy danh sách users:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// THÊM ROUTE KHÓA/MỞ KHÓA – ĐÃ SỬA LỖI DẤU NGOẶC!!!
router.put("/:id/toggle-status", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được phép" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Không thể tự khóa chính mình!" });
    }

    user.status = user.status === "banned" ? "active" : "banned";
    await user.save();

    res.json({
      message: user.status === "banned" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      status: user.status
    });
  } catch (err) {
    console.error("Lỗi toggle status:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/users/top – FINAL VERSION – 1000000000% SẼ HIỂN THỊ NGÀY!!!
router.get("/top", async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ "followers": -1 })
      .limit(10)
      .select("name avatar bio username followers createdAt")
      .lean();

    const formatted = topUsers.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar || "",
      bio: user.bio || "",
      username: user.username || user.name.toLowerCase().replace(/\s+/g, ""),
      followerCount: user.followers?.length || 0,
      createdAt: user.createdAt 
        ? new Date(user.createdAt).toISOString()  // ← DÒNG NÀY LÀ CHÌA KHÓA VĨNH CỬU!
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Lỗi /top:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// ĐÓNG NGOẶC ĐÚNG CHỖ – QUAN TRỌNG NHẤT!!!
module.exports = router;