const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const chatbotController = require("../controllers/chatbot.controller");

router.use(authMiddleware);

router.post("/sessions", chatbotController.createSession);
router.get("/sessions", chatbotController.getSessions);
router.delete("/sessions/:sessionId", chatbotController.deleteSession);

router.get("/sessions/:sessionId/messages", chatbotController.getSessionMessages);
router.post("/sessions/:sessionId/messages", chatbotController.sendMessage);

module.exports = router;