const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Đăng ký
router.post("/register", authController.register);

// Đăng nhập
router.post("/login", authController.login);

// Lấy thông tin user hiện tại (cần đăng nhập)
router.get("/me", authMiddleware, authController.getMe);

// Cập nhật hồ sơ (cần đăng nhập)
router.put("/profile", authMiddleware, authController.updateProfile);

// Đổi mật khẩu (cần đăng nhập)
router.put("/change-password", authMiddleware, authController.changePassword);

// Route quên mật khẩu (Không cần token đăng nhập)
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;