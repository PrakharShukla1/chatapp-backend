// models/Status.js - Story/Status Schema (auto-deletes after 24hrs)
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Either image URL or text
    type: {
      type: String,
      enum: ["image", "text"],
      required: true,
    },
    content: {
      type: String, // Image URL or text content
      required: true,
    },
    // Background color for text statuses
    backgroundColor: {
      type: String,
      default: "#075e54",
    },
    // Viewers list
    viewers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    // Auto-delete after 24 hours using MongoDB TTL index
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index - MongoDB automatically deletes expired documents
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", statusSchema);
