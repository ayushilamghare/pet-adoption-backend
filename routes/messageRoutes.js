const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getConversation,
  getConversations
} = require("../controller/messageController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, sendMessage);
router.get("/conversations", authMiddleware, getConversations);
router.get("/:userId", authMiddleware, getConversation);

module.exports = router;
