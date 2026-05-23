// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { subscribe, getVapidKey } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/vapid-key", getVapidKey);
router.post("/subscribe", protect, subscribe);

module.exports = router;
