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

module.exports = router;