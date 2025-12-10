// backend/routes/followRoutes.js – HOÀN HẢO + CÓ THÔNG BÁO
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");

router.post("/:id", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "Không thể tự theo dõi" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // BỎ THEO DÕI
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
        User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } })
      ]);
    } else {
      // THEO DÕI + TẠO THÔNG BÁO
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
        User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } })
      ]);

      // TẠO THÔNG BÁO FOLLOW
      await Notification.create({
        to: targetUserId,
        from: currentUserId,
        type: "follow"
      });
    }

    const updatedCurrentUser = await User.findById(currentUserId)
      .select("following followers")
      .lean();

    res.json({ 
      following: !isFollowing,
      user: updatedCurrentUser 
    });

  } catch (err) {
    console.error("Lỗi follow:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/status/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isFollowing = user.following.includes(req.params.id);
    res.json({ following: isFollowing });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;