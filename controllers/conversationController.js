// controllers/conversationController.js - Conversation Logic
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// ─── @desc   Get all conversations for current user ───────────
// ─── @route  GET /api/conversations ──────────────────────────
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name avatar isOnline lastSeen")
      .populate("groupId", "name avatar members admin")
      .populate({
        path: "lastMessage",
        populate: { path: "senderId", select: "name" },
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Get or create direct conversation ────────────────
// ─── @route  POST /api/conversations ─────────────────────────
const createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "name avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "senderId", select: "name" },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        isGroup: false,
      });
      conversation = await conversation
        .populate("participants", "name avatar isOnline lastSeen");
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getConversations, createOrGetConversation };
