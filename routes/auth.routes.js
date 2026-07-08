const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.get("/me", authMiddleware, authController.getMe);

router.put("/profile", authMiddleware, authController.updateProfile);

router.put("/change-password", authMiddleware, authController.changePassword);

router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;