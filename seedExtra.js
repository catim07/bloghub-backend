const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Author = require("./models/Author");
const Tag = require("./models/Tag");

// ✅ Kết nối MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Kết nối MongoDB thành công");

    // --- AUTHORS ---
    const authors = [
      {
        name: "Nguyễn Văn A",
        avatar: "https://i.pravatar.cc/150?img=1",
        followers: 12500,
        bio: "Full-stack Developer, yêu thích React và Node.js",
      },
      {
        name: "Trần Thị B",
        avatar: "https://i.pravatar.cc/150?img=5",
        followers: 8300,
        bio: "Frontend Engineer tại Tech Corp",
      },
      {
        name: "Lê Minh C",
        avatar: "https://i.pravatar.cc/150?img=3",
        followers: 15100,
        bio: "Next.js enthusiast & Tech blogger",
      },
    ];

    // --- TAGS ---
    const tags = [
      { name: "JavaScript", count: 1200 },
      { name: "React", count: 956 },
      { name: "TypeScript", count: 832 },
      { name: "CSS", count: 721 },
    ];

    // 🧹 Xóa cũ, thêm mới
    await Author.deleteMany({});
    await Author.insertMany(authors);
    console.log("✅ Đã thêm 3 featured authors vào MongoDB");

    await Tag.deleteMany({});
    await Tag.insertMany(tags);
    console.log("✅ Đã thêm top tags vào MongoDB");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
