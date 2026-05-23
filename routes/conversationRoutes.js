// routes/conversationRoutes.js
const express = require("express");
const router = express.Router();
const { getConversations, createOrGetConversation } = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getConversations);
router.post("/", createOrGetConversation);

module.exports = router;
