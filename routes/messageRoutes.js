// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, editMessage, deleteMessage, searchMessages, markAsSeen } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { uploadAttachment } = require("../config/cloudinary");

router.use(protect);

router.post("/", uploadAttachment.single("attachment"), sendMessage);
router.get("/:conversationId", getMessages);
router.get("/search/:conversationId", searchMessages);
router.put("/seen/:conversationId", markAsSeen);
router.put("/:id", editMessage);
router.delete("/:id", deleteMessage);

module.exports = router;
