const mongoose = require("mongoose");
const Article = require("./models/Article"); // 🔹 đảm bảo đúng đường dẫn
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Kết nối MongoDB thành công");

    const articles = [
      {
        title: "React Hooks: Hướng dẫn toàn diện cho người mới bắt đầu",
        description: "Tìm hiểu useState, useEffect và các Hook nâng cao.",
        author: { name: "Nguyễn Văn A", avatar: "https://i.pravatar.cc/150?img=1" },
        thumbnail: "https://images.unsplash.com/photo-1595623654300-b27329804025?auto=format&fit=crop&w=1080&q=80",
        likes: 120,
        comments: 14,
        tags: ["React", "JavaScript"],
        readTime: "7 phút đọc",
        date: "1 ngày trước",
      },
      {
        title: "Node.js & Express: Xây dựng REST API chuẩn thực tế",
        description: "Tạo API hiện đại với Express và MongoDB.",
        author: { name: "Trần Thị B", avatar: "https://i.pravatar.cc/150?img=2" },
        thumbnail: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1080&q=80",
        likes: 250,
        comments: 28,
        tags: ["Node.js", "Backend"],
        readTime: "10 phút đọc",
        date: "3 ngày trước",
      },
      {
        title: "TypeScript cho người mới: Bắt đầu từ con số 0",
        description: "Cách áp dụng TypeScript trong dự án React để code an toàn hơn.",
        author: { name: "Lê Minh C", avatar: "https://i.pravatar.cc/150?img=3" },
        thumbnail: "https://images.unsplash.com/photo-1457305237443-44c3d5a30b89?auto=format&fit=crop&w=1080&q=80",
        likes: 180,
        comments: 22,
        tags: ["TypeScript", "React"],
        readTime: "8 phút đọc",
        date: "2 ngày trước",
      },
    ];

    // 🧹 Xóa cũ, thêm mới
    await Article.deleteMany({});
    await Article.insertMany(articles);
    console.log("✅ Đã thêm 3 bài viết mẫu thành công!");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
