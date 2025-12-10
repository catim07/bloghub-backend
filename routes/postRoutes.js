const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// Lấy danh sách bài viết
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo bài viết mới
router.post("/", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json({ message: "✅ Tạo bài viết thành công!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Xóa bài viết
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ Xóa bài viết thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật bài viết
router.put("/:id", async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
