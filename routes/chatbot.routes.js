const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const chatbotController = require("../controllers/chatbot.controller");

const { sendGuestMessage } = require('../controllers/chatbot.controller');
router.post('/sessions/guest-message', sendGuestMessage);
// Toàn bộ route chatbot yêu cầu đăng nhập
router.use(authMiddleware);

// Session
router.post("/sessions", chatbotController.createSession);
router.get("/sessions", chatbotController.getSessions);
router.delete("/sessions/:sessionId", chatbotController.deleteSession);

// Messages
router.get("/sessions/:sessionId/messages", chatbotController.getSessionMessages);
router.post("/sessions/:sessionId/messages", chatbotController.sendMessage);

module.exports = router;