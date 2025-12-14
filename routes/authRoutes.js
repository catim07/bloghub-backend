// backend/routes/authRoutes.js
// ĐÃ HOÀN THIỆN: THÊM status + role rõ ràng + trả về dữ liệu đầy đủ + cực kỳ sạch sẽ!

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ================== ĐĂNG NHẬP ==================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    // Nếu user bị khóa thì không cho đăng nhập
    if (user.status === "banned") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active", // đảm bảo luôn có status
      },
    });
  } catch (err) {
    console.error("Lỗi login:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ================== ĐĂNG KÝ ==================
// HOÀN HẢO TUYỆT ĐỐI – CÓ status + role + trả về token luôn!
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Kiểm tra email trùng
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải từ 6 ký tự trở lên" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // TẠO USER MỚI – HOÀN HẢO VỚI status VÀ role!!!
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "user",           // luôn là user khi đăng ký
      status: "active",       // THÊM DÒNG NÀY – QUAN TRỌNG NHẤT!!!
    });

    await newUser.save();

    // Tạo token ngay khi đăng ký (UX cực tốt)
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    // Trả về đầy đủ thông tin
    res.status(201).json({
      message: "Đăng ký thành công! Chào mừng bạn đến với BlogHub",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
router.post("/google", async (req, res) => {
  console.log("\n=== GOOGLE LOGIN - BẮT ĐẦU ===");
  console.log("req.body TOÀN BỘ:", JSON.stringify(req.body, null, 2)); // In đẹp để thấy email

  const { googleUser } = req.body;

  if (!googleUser) {
    console.log("LỖI: Không có googleUser");
    return res.status(400).json({ message: "Thiếu dữ liệu Google" });
  }

  console.log("googleUser.email:", googleUser.email); // Dòng này sẽ in email của bạn

  if (!googleUser.email) {
    console.log("LỖI: Không có email trong googleUser");
    return res.status(400).json({ message: "Không tìm thấy email từ Google" });
  }

  const { email, name, picture, sub: googleId } = googleUser;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("Đang tạo user mới...");
      user = new User({
        name: name || "Google User",
        email: email.toLowerCase(),
        googleId,
        role: "user",
        status: "active",
        avatar: picture,
      });
      await user.save();
      console.log("Tạo user thành công!");
    } else {
      console.log("User đã tồn tại, đang cập nhật...");
      user.googleId = googleId || user.googleId;
      user.avatar = picture || user.avatar;
      user.name = name || user.name;
      await user.save();
      console.log("Cập nhật user thành công!");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    console.log("✅ GOOGLE LOGIN THÀNH CÔNG HOÀN TOÀN!!!");
    console.log("User:", user.name, user.email);

    return res.json({
      message: "Đăng nhập Google thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("LỖI DATABASE HOẶC SERVER:", err);
    return res.status(500).json({ message: "Lỗi server khi xử lý Google login" });
  }
});
module.exports = router;