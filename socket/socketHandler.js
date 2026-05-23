// socket/socketHandler.js - All Socket.IO Event Handlers
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

const initSocket = (io) => {
  // ─── Auth Middleware ───────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

    // ─── Mark user online ────────────────────────────────────
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("user_online", { userId });

    // ─── Join conversation rooms ──────────────────────────────
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`👥 ${socket.user.name} joined room: ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // ─── Send Message ─────────────────────────────────────────
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, receiverId, message, type, replyTo } = data;

        const newMessage = await Message.create({
          conversationId,
          senderId: userId,
          receiverId,
          message,
          type: type || "text",
          replyTo: replyTo || null,
          status: "sent",
        });

        await newMessage.populate("senderId", "name avatar");

        // Emit to all in conversation
        io.to(conversationId).emit("receive_message", newMessage);

        // Update status to delivered if receiver is online
        if (receiverId && onlineUsers.has(receiverId)) {
          await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
          io.to(conversationId).emit("message_status_update", {
            messageId: newMessage._id,
            status: "delivered",
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ─── Typing Indicators ────────────────────────────────────
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("typing", {
        userId,
        userName: socket.user.name,
        conversationId,
        isTyping,
      });
    });

    // ─── Message Status Updates ───────────────────────────────
    socket.on("message_seen", async ({ messageId, conversationId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "seen" });
        io.to(conversationId).emit("message_status_update", {
          messageId,
          status: "seen",
        });
      } catch (error) {
        console.error("message_seen error:", error);
      }
    });

    // ─── Delete Message ───────────────────────────────────────
    socket.on("delete_message", async ({ messageId, conversationId, deleteFor }) => {
      io.to(conversationId).emit("message_deleted", {
        messageId,
        conversationId,
        deleteFor,
      });
    });

    // ─── Edit Message ─────────────────────────────────────────
    socket.on("edit_message", async ({ messageId, conversationId, newMessage }) => {
      io.to(conversationId).emit("message_edited", {
        messageId,
        conversationId,
        newMessage,
      });
    });

    // ─── WebRTC Video Calling ─────────────────────────────────

    // Initiate call
    socket.on("call_user", ({ targetUserId, offer, callerInfo }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("incoming_call", {
          callerId: userId,
          callerInfo,
          offer,
        });
      } else {
        socket.emit("call_unavailable", { message: "User is not online" });
      }
    });

    // Accept call
    socket.on("call_accepted", ({ callerId, answer }) => {
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket).emit("call_accepted", { answer });
      }
    });

    // Reject call
    socket.on("call_rejected", ({ callerId }) => {
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket).emit("call_rejected");
      }
    });

    // End call
    socket.on("call_ended", ({ targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("call_ended");
      }
    });

    // ICE Candidates (WebRTC signaling)
    socket.on("ice_candidate", ({ targetUserId, candidate }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("ice_candidate", { candidate });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("user_offline", { userId, lastSeen: new Date() });
    });
  });
};

module.exports = initSocket;
