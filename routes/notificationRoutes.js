// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const Notification = require("../models/Notification");

// LẤY TẤT CẢ THÔNG BÁO CỦA USER
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ to: req.user._id })
      .populate("from", "name avatar")
      .populate("article", "title")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
router.post("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { to: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "Đã đánh dấu tất cả đã đọc" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});
// THÊM DÒNG NÀY VÀO CUỐI FILE notificationRoutes.js (trước module.exports)

router.post("/:id/read", protect, async (req, res) => {
  try {
    const result = await Notification.findOneAndUpdate(
      { _id: req.params.id, to: req.user._id },
      { read: true },
      { new: true }
    );

    if (!result) return res.status(404).json({ message: "Không tìm thấy thông báo" });

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
module.exports = router;