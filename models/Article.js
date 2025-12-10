const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: String,
    description: String, // dùng mô tả hoặc nội dung bài viết
    author: {
      name: String,
      avatar: String,
    },
    thumbnail: String,
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    tags: [String],
    readTime: String, // sẽ được tự động tính
  },
  {
    collection: "articles",
    timestamps: true,
  }
);

// 🔥 Tự động tính readTime trước khi lưu
articleSchema.pre("save", function (next) {
  if (this.description) {
    const words = this.description.trim().split(/\s+/).length;
    const wordsPerMinute = 200; // tốc độ đọc trung bình
    const minutes = Math.ceil(words / wordsPerMinute);
    this.readTime = `${minutes} phút đọc`;
  } else {
    this.readTime = "1 phút đọc";
  }
  next();
});

module.exports = mongoose.model("Article", articleSchema);
