const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  name: String,
  count: String,
});

module.exports = mongoose.model("Tag", tagSchema);
