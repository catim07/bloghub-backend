const express = require("express");
const router = express.Router();

const Tag = require("../models/Tag");

// GET /api/tags
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải tags", error: err.message });
  }
});

module.exports = router;
