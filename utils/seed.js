// utils/seed.js - Sample seed data for development
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  console.log("🌱 Seeding database...");

  // Clear existing data
  await User.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});

  // Create sample users
  const users = await User.insertMany([
    {
      name: "Alice Johnson",
      email: "alice@demo.com",
      password: "password123", // will be hashed by pre-save hook
      bio: "Frontend developer & coffee enthusiast ☕",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    },
    {
      name: "Bob Smith",
      email: "bob@demo.com",
      password: "password123",
      bio: "Backend wizard 🧙 | Node.js + MongoDB",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
    {
      name: "Carol White",
      email: "carol@demo.com",
      password: "password123",
      bio: "UI/UX Designer | Making apps beautiful",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    },
    {
      name: "David Lee",
      email: "david@demo.com",
      password: "password123",
      bio: "DevOps & Cloud | AWS certified",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
  ]);

  // Create a conversation between Alice and Bob
  const conversation = await Conversation.create({
    participants: [users[0]._id, users[1]._id],
    isGroup: false,
  });

  // Add sample messages
  const messages = await Message.insertMany([
    {
      conversationId: conversation._id,
      senderId: users[0]._id,
      receiverId: users[1]._id,
      message: "Hey Bob! Have you checked the new project requirements?",
      status: "seen",
    },
    {
      conversationId: conversation._id,
      senderId: users[1]._id,
      receiverId: users[0]._id,
      message: "Yes! I was just looking at them. The real-time chat feature looks exciting! 🚀",
      status: "seen",
    },
    {
      conversationId: conversation._id,
      senderId: users[0]._id,
      receiverId: users[1]._id,
      message: "Totally! I'm thinking Socket.IO for the real-time part. What do you think?",
      status: "seen",
    },
    {
      conversationId: conversation._id,
      senderId: users[1]._id,
      receiverId: users[0]._id,
      message: "Perfect choice! Let's also add WebRTC for video calls. 📹",
      status: "delivered",
    },
  ]);

  // Update last message
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: messages[messages.length - 1]._id,
  });

  console.log("✅ Seed completed!");
  console.log("\n📋 Demo Accounts:");
  console.log("  alice@demo.com / password123");
  console.log("  bob@demo.com   / password123");
  console.log("  carol@demo.com / password123");
  console.log("  david@demo.com / password123");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
