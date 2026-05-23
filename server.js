// ============================================================
// server.js - Main Entry Point
// ============================================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const initSocket = require("./socket/socketHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const groupRoutes = require("./routes/groupRoutes");
const statusRoutes = require("./routes/statusRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Middleware imports
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handlers
initSocket(io);

// Make io accessible throughout the app
app.set("io", io);

// ─── Connect Database ────────────────────────────────────────
connectDB();

// ─── Express Middleware ──────────────────────────────────────
const cors = require("cors");

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "ChatApp API is running" });
});

// ─── Error Handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT,"0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
