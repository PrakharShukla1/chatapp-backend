// models/Conversation.js - Conversation Schema
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Participants in direct chat (2 users)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Whether it's a group conversation
    isGroup: {
      type: Boolean,
      default: false,
    },
    // Reference to group if isGroup is true
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    // Last message for preview in sidebar
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Unread count per user
    unreadCounts: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Index for fast participant lookup
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
