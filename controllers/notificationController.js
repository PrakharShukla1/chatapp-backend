// controllers/notificationController.js - Push Notifications
const webpush = require("web-push");
const User = require("../models/User");

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@chatapp.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ─── @desc   Save push subscription ──────────────────────────
// ─── @route  POST /api/notifications/subscribe ────────────────
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.json({ message: "Subscribed to push notifications" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Get VAPID public key ────────────────────────────
// ─── @route  GET /api/notifications/vapid-key ────────────────
const getVapidKey = async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
};

// ─── Helper: Send push notification to user ─────────────────
const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (user?.pushSubscription) {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(payload)
      );
    }
  } catch (error) {
    console.error("Push notification failed:", error.message);
  }
};

module.exports = { subscribe, getVapidKey, sendPushNotification };
