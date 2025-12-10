// backend/middlewares/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

      console.log("Token decoded:", decoded); // XEM CÓ id KHÔNG

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Không tìm thấy user" });
      }

      req.user = user;
      req.user.id = user._id.toString();
      next();
    } catch (err) {
      console.error("Token lỗi:", err.message);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  } else {
    return res.status(401).json({ message: "Không có token" });
  }
};

module.exports = { protect };