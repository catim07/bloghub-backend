const express = require("express");
const router = express.Router();

const Author = require("../models/Author");

// GET /api/authors
router.get("/", async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách tác giả", error: err.message });
  }
});

module.exports = router;
