// backend/routes/articleRoutes.js – BẢN CUỐI CÙNG, HOÀN HẢO 100% (25/11/2025)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const { protect } = require("../middlewares/auth");
const User = require("../models/User");           // THÊM DÒNG NÀY
const Notification = require("../models/Notification");
// ==================== TẠO BÀI VIẾT ====================
router.post("/", protect, async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;
    const newPost = await Post.create({
      title: title.trim(),
      content,
      image: image || "",
      tags: tags || [],
      author: req.user._id,
      authorName: req.user.name || "Người dùng",
      authorAvatar: req.user.avatar || "",
      likes: [],
      comments: [],
    });
const followers = await User.find({ following: req.user._id }).select("_id");
if (followers.length > 0) {
  const notifications = followers.map(f => ({
    to: f._id,
    from: req.user._id,
    type: "new_post",
    article: newPost._id
  }));
  await Notification.insertMany(notifications);
}
    const populatedPost = await Post.findById(newPost._id).populate("author", "name avatar");
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Lỗi tạo bài:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ==================== LẤY BÀI VIẾT ====================
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "_id name avatar")
      .populate({
        path: "reports.reporter",
        select: "name avatar",
        model: "User"
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "_id name avatar");
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ==================== LIKE / UNLIKE ====================
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const userId = req.user._id.toString();
    const likedIndex = post.likes.indexOf(userId);

    if (likedIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likedIndex, 1);
    }

    await post.save();
        // TẠO THÔNG BÁO KHI LIKE (chỉ gửi khi thật sự là LIKE, không gửi khi unlike)
    if (likedIndex === -1 && post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        to: post.author,
        from: req.user._id,
        type: "like",
        article: post._id,
      });
    }
    res.json({
      liked: likedIndex === -1,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("Lỗi like:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung không được để trống" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
      author: req.user._id,
      authorName: req.user.name || "Người dùng",
      authorAvatar: req.user.avatar || "",
      createdAt: new Date(),
      likes: 0,
      replies: [],
      isHidden: false,
    };

    post.comments.push(newComment);
    await post.save();

    // Gửi thông báo
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        to: post.author,
        from: req.user._id,
        type: "comment",
        article: post._id,
        message: content.trim().slice(0, 100),
      });
    }

    // TRẢ VỀ CHÍNH XÁC COMMENT MỚI + ĐẦY ĐỦ FIELD
    res.status(201).json({
      ...newComment,
      _id: newComment._id.toString(),
    });
  } catch (err) {
    console.error("Lỗi thêm bình luận:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// TRẢ LỜI BÌNH LUẬN – BẢN CUỐI, KHÔNG LỖI ĐỎ, F5 CŨNG KO CẦN NỮA
router.post("/:id/comments/:commentId/reply", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung trả lời không được để trống" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const parentComment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!parentComment) return res.status(404).json({ message: "Bình luận không tồn tại" });

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
      author: req.user._id,
      authorName: req.user.name || "Người dùng",
      authorAvatar: req.user.avatar || "",
      createdAt: new Date(),
      likes: 0,
      isHidden: false,
    };

    parentComment.replies.push(newReply);
    await post.save();

    // Gửi thông báo
    if (parentComment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        to: parentComment.author,
        from: req.user._id,
        type: "reply",
        article: post._id,
        message: content.trim().slice(0, 80),
        parentCommentId: req.params.commentId,
      });
    }

    // TRẢ VỀ REPLY MỚI, ĐẦY ĐỦ, KHÔNG DÍNH MONGOOSE
    res.status(201).json({
      ...newReply,
      _id: newReply._id.toString(),
    });
  } catch (err) {
    console.error("Lỗi reply:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ==================== XÓA BÀI VIẾT ====================
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài viết thành công" });
  } catch (err) {
    console.error("Lỗi xóa bài viết:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ADMIN: XÓA BÁO CÁO CỦA BÌNH LUẬN HOẶC REPLY (HOÀN HẢO 100%)
router.delete("/:articleId/comments/:commentId/reports/:reportId", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được phép" });
    }

    const { articleId, commentId, reportId } = req.params;

    // Cách 1: Xóa trong bình luận chính
    let result = await Post.updateOne(
      { _id: articleId, "comments._id": commentId },
      { $pull: { "comments.$.reports": { _id: reportId } } }
    );

    // Nếu không tìm thấy → có thể là reply → tìm trong replies
    if (result.modifiedCount === 0) {
      result = await Post.updateOne(
        { _id: articleId, "comments.replies._id": commentId },
        { $pull: { "comments.$.replies.$[].reports": { _id: reportId } } }
      );
    }

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    res.json({ message: "Đã xóa báo cáo thành công!" });
  } catch (err) {
    console.error("Lỗi xóa báo cáo:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// BÁO CÁO REPLY
router.post("/:id/comments/:parentId/replies/:replyId/report", protect, async (req, res) => {
  try {
    const { reason, detail } = req.body;
    if (!reason) return res.status(400).json({ message: "Chọn lý do báo cáo" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    let found = false;
    for (let c of post.comments) {
      for (let r of c.replies) {
        if (r._id.toString() === req.params.replyId) {
          // Kiểm tra đã báo cáo chưa
          const already = r.reports?.some(rep => rep.reporter.toString() === req.user._id.toString());
          if (already) return res.status(400).json({ message: "Bạn đã báo cáo rồi" });

          r.reports.push({
            reporter: req.user._id,
            reason,
            detail,
            reportedAt: new Date(),
          });
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) return res.status(404).json({ message: "Không tìm thấy trả lời" });

    await post.save();
    res.json({ message: "Đã báo cáo trả lời!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// ==================== CẬP NHẬT (SỬA) BÀI VIẾT – HOÀN HẢO 100% ====================
router.put("/:id", protect, async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Tiêu đề và nội dung không được để trống" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // Chỉ chủ bài mới được sửa
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này" });
    }

    // Cập nhật các field
    post.title = title.trim();
    post.content = content;
    post.image = image || post.image; // giữ lại ảnh cũ nếu không đổi
    post.tags = tags || [];

    await post.save();

    // Trả về bài viết đã cập nhật (có populate để frontend nhận được author name/avatar)
    const updatedPost = await Post.findById(post._id).populate("author", "name avatar");
    res.json(updatedPost);
  } catch (err) {
    console.error("Lỗi cập nhật bài viết:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// POST /api/articles/:id/report
router.post("/:id/report", protect, async (req, res) => {
  try {
    const postId = req.params.id;
    const { reason } = req.body;
    const reporterId = req.user._id;

    if (!reason) {
      return res.status(400).json({ message: "Vui lòng chọn lý do báo cáo" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    // Tránh spam
    const already = post.reports.some(r => r.reporter.toString() === reporterId.toString());
    if (already) {
      return res.status(400).json({ message: "Bạn đã báo cáo bài viết này rồi!" });
    }

    // CHUYỂN REASON THÀNH NỘI DUNG ĐẦY ĐỦ
    const reasonMap = {
      spam: "Tin rác hoặc quảng cáo",
      harassment: "Quấy rối, xúc phạm người khác",
      inappropriate: "Nội dung không phù hợp",
      copyright: "Vi phạm bản quyền",
      violence: "Bạo lực hoặc đe dọa",
      other: "Lý do khác",
    };

    post.reports.push({
      reporter: reporterId,
      post: postId,
      reason: reason,
      detail: reasonMap[reason],   // ← đây chính là "nội dung" anh muốn lưu
      reportedAt: new Date(),
    });

    await post.save();

    return res.json({ message: "Báo cáo đã được gửi thành công!" });

  } catch (err) {
    console.error("Lỗi báo cáo:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});
// PUT /api/articles/:id/toggle-hide – ADMIN CHỈ ĐƯỢC ẨN/HIỆN BÀI VIẾT
router.put("/:id/toggle-hide", protect, async (req, res) => {
  try {
    // Chỉ admin mới được phép
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được phép" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    post.isHidden = !post.isHidden;
    await post.save();

    res.json({
      message: post.isHidden ? "Đã ẩn bài viết" : "Đã hiện bài viết",
      isHidden: post.isHidden
    });
  } catch (err) {
    console.error("Lỗi toggle ẩn bài viết:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// POST /api/articles/:id/comments/:commentId/report
router.post("/:id/comments/:commentId/report", protect, async (req, res) => {
  const { reason, detail = "" } = req.body;
  const post = await Post.findById(req.params.id);
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

  comment.reports.push({
    reporter: req.user._id,
    reason,
    detail,
  });

  await post.save();
  res.json({ message: "Đã báo cáo bình luận!" });
});
// backend/routes/articleRoutes.js
router.delete("/:id/reports/:reportId", protect, async (req, res) => {
  try {
    // Chỉ admin mới được xóa báo cáo
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được phép" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // Cách an toàn nhất: dùng $pull để xóa trực tiếp trong mảng
    const result = await Post.updateOne(
      { _id: req.params.id },
      { $pull: { reports: { _id: req.params.reportId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo để xóa" });
    }

    // Optional: trả về danh sách reports mới (hoặc chỉ thông báo thành công)
    const updatedPost = await Post.findById(req.params.id).select("reports");
    
    return res.json({ 
      message: "Đã xóa báo cáo thành công",
      reports: updatedPost.reports 
    });

  } catch (error) {
    console.error("Lỗi xóa báo cáo:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa báo cáo" });
  }
});
// backend/routes/articleRoutes.js hoặc commentRoutes.js
// XÓA TỪNG BÁO CÁO CỦA BÌNH LUẬN HOẶC REPLY (ADMIN ONLY) – ĐÃ SỬA LỖI
router.delete("/:articleId/comments/:commentId/reports/:reportId", protect, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được phép" });
    }

    const post = await Post.findById(req.params.articleId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    let found = false;

    // Tìm trong bình luận chính
    for (let c of post.comments) {
      if (c._id.toString() === req.params.commentId) {
        c.reports.id(req.params.reportId)?.remove();
        found = true;
        break;
      }
      // Tìm trong reply (nếu commentId là reply)
      for (let r of c.replies) {
        if (r._id.toString() === req.params.commentId) {
          r.reports.id(req.params.reportId)?.remove();
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    await post.save();
    res.json({ message: "Đã xóa báo cáo thành công" });
  } catch (err) {
    console.error("Lỗi xóa báo cáo bình luận:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// ==================== ẨN / HIỆN BÌNH LUẬN (ADMIN ONLY) ====================
router.put("/:id/comments/:commentId/toggle-hide", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được ẩn bình luận" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Bình luận không tồn tại" });

    comment.isHidden = !comment.isHidden;
    await post.save();

    res.json({
      success: true,
      isHidden: comment.isHidden,
      message: comment.isHidden ? "Đã ẩn bình luận" : "Đã hiện lại bình luận"
    });
  } catch (err) {
    console.error("Lỗi ẩn bình luận:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ==================== ẨN / HIỆN TRẢ LỜI (REPLY) – ADMIN ONLY ====================
router.put("/:id/comments/:parentId/replies/:replyId/toggle-hide", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được ẩn trả lời" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const parentComment = post.comments.id(req.params.parentId);
    if (!parentComment) return res.status(404).json({ message: "Bình luận cha không tồn tại" });

    const reply = parentComment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: "Trả lời không tồn tại" });

    reply.isHidden = !reply.isHidden;
    await post.save();

    res.json({
      success: true,
      isHidden: reply.isHidden,
      message: reply.isHidden ? "Đã ẩn trả lời" : "Đã hiện lại trả lời"
    });
  } catch (err) {
    console.error("Lỗi ẩn reply:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// XÓA BÌNH LUẬN HOẶC TRẢ LỜI (REPLY) – HOÀN HẢO, KHÔNG LỖI, KHÔNG ẢNH HƯỞNG GÌ KHÁC!
router.delete("/:id/comments/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id); // ← đổi ở đây
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isArticleOwner = post.author.toString() === userId;
    const commentId = req.params.commentId;

    let deleted = false;
    let message = "";

    // Case 1: Xóa comment chính
    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex !== -1) {
      const commentOwner = post.comments[commentIndex].author.toString();
      if (!isAdmin && !isArticleOwner && commentOwner !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
      }
      post.comments.splice(commentIndex, 1);
      deleted = true;
      message = "Đã xóa bình luận thành công!";
    }
    // Case 2: Xóa reply
    else {
      for (let i = 0; i < post.comments.length; i++) {
        const replies = post.comments[i].replies;
        const replyIndex = replies.findIndex(r => r._id.toString() === commentId);
        if (replyIndex !== -1) {
          const replyOwner = replies[replyIndex].author.toString();
          if (!isAdmin && !isArticleOwner && replyOwner !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền xóa trả lời này" });
          }
          replies.splice(replyIndex, 1);
          deleted = true;
          message = "Đã xóa trả lời thành công!";
          break;
        }
      }
    }

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy bình luận để xóa" });
    }

    await post.save();
    res.json({ success: true, message });

  } catch (err) {
    console.error("Lỗi xóa bình luận:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
module.exports = router;