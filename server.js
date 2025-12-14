// backend/server.js – BẢN SẠCH NHẤT 2025
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173","https://bloghub-frontend-juan.netlify.app","https://bloghubegg.netlify.app",],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// TẤT CẢ ROUTES – ĐÃ XÓA /api/tags ĐỂ TRÁNH CONFLICT
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/articles", require("./routes/articleRoutes"));
app.use("/api/authors", require("./routes/authorRoutes"));
// ĐÃ XÓA DÒNG NÀY: app.use("/api/tags", require("./routes/tagRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bloghub")
  .then(() => console.log("MongoDB kết nối thành công!"))
  .catch(err => {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  });

app.use((req, res, next) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);
  res.status(err.status || 500).json({ 
    message: err.message || "Lỗi server nội bộ" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`────────────────────────────────────────`);
  console.log(`SERVER CHẠY MƯỢT TẠI http://localhost:${PORT}`);
  console.log(`ĐÃ XÓA ROUTE /api/tags – BÂY GIỜ FRONTEND TỰ TÍNH TAG`);
  console.log(`BLOGHUB HOÀN HẢO TUYỆT ĐỐI 100%`);
  console.log(`────────────────────────────────────────`);
});