// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "new_post", "reply"], // THÊM "reply" VÀO ĐÂY
      required: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    message: {
      type: String,
      trim: true,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    parentCommentId: { // Bonus: để sau click vào nhảy đúng chỗ reply
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index mạnh như cũ
notificationSchema.index({ to: 1, createdAt: -1 });
notificationSchema.index({ to: 1, read: 1, createdAt: -1 });

// Virtuals
notificationSchema.virtual("fromInfo", {
  ref: "User",
  localField: "from",
  foreignField: "_id",
  justOne: true,
});

notificationSchema.virtual("articleInfo", {
  ref: "Post",
  localField: "article",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model("Notification", notificationSchema);