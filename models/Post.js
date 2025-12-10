// backend/models/Post.js – PHIÊN BẢN ĐÃ SỬA SẠCH, CHẠY NGON NGAY
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  tags: [{ type: String }],

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },

  likes: {
    type: [String], // lưu userId dạng string cho nhanh
    default: [],
  },

  comments: [
    {
      content: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      authorName: { type: String, required: true },
      authorAvatar: { type: String },
      createdAt: { type: Date, default: Date.now },
      likes: { type: Number, default: 0 },
      isHidden: { type: Boolean, default: false },

      // Báo cáo comment
      reports: [
        {
          reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          reason: {
            type: String,
            required: true,
            enum: ["spam", "harassment", "inappropriate", "violence", "violence", "copyright", "other"],
          },
          detail: { type: String, default: "" },
          reportedAt: { type: Date, default: Date.now },
        },
      ],

      // Reply của comment (nếu cần báo cáo reply thì thêm reports tương tự)
      replies: [
        {
          content: { type: String, required: true },
          author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          authorName: { type: String, required: true },
          authorAvatar: { type: String },
          createdAt: { type: Date, default: Date.now },
          likes: { type: Number, default: 0 },
          reports: [  // ← THÊM DÒNG NÀY!!!
      {
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reason: { type: String, required: true },
        detail: { type: String },
        reportedAt: { type: Date, default: Date.now },
      }
    ],
    isHidden: { type: Boolean, default: false },
        },
      ],
    },
  ],

  isHidden: { type: Boolean, default: false },

  // BÁO CÁO BÀI VIẾT – ĐẶT ĐÚNG TRONG SCHEMA!!!
  reports: [
    {
      reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      reason: {
        type: String,
        required: true,
        enum: ["spam", "harassment", "inappropriate", "violence", "copyright", "other"],
      },
      detail: {
        type: String,
        required: true,
      },
      reportedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
},
{
  timestamps: false // vì mình đã tự set createdAt
});

// ==================== INDEXES – ĐẶT SAU SCHEMA ====================
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ author: 1 });
postSchema.index({ isHidden: 1 });
postSchema.index({ "reports.reportedAt": -1 });          // xem báo cáo bài viết mới nhất
postSchema.index({ "comments.reports.reportedAt": -1 }); // báo cáo comment
// Nếu có báo cáo reply thì thêm:
// postSchema.index({ "comments.replies.reports.reportedAt": -1 });

module.exports = mongoose.model("Post", postSchema);