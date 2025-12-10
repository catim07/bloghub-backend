const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema({
  name: String,
  avatar: String,
  followers: Number,
  bio: String,
});

module.exports = mongoose.model("Author", authorSchema);
