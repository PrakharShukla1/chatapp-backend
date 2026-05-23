// controllers/statusController.js - Status/Stories Logic
const Status = require("../models/Status");
const User = require("../models/User");

// ─── @desc   Create status ────────────────────────────────────
// ─── @route  POST /api/status ────────────────────────────────
const createStatus = async (req, res) => {
  try {
    const { type, content, backgroundColor } = req.body;

    let statusContent = content;
    if (type === "image" && req.file) {
      statusContent = req.file.path; // Cloudinary URL
    }

    const status = await Status.create({
      userId: req.user._id,
      type: type || "text",
      content: statusContent,
      backgroundColor: backgroundColor || "#075e54",
    });

    await status.populate("userId", "name avatar");
    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Get statuses from contacts ───────────────────────
// ─── @route  GET /api/status ─────────────────────────────────
const getStatuses = async (req, res) => {
  try {
    // Get all non-expired statuses (MongoDB TTL handles deletion)
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });

    // Group statuses by user
    const grouped = {};
    statuses.forEach((s) => {
      const uid = s.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = { user: s.userId, statuses: [] };
      }
      grouped[uid].statuses.push(s);
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   View a status (add viewer) ───────────────────────
// ─── @route  POST /api/status/:id/view ───────────────────────
const viewStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: "Status not found" });

    const alreadyViewed = status.viewers.some(
      (v) => v.userId.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      status.viewers.push({ userId: req.user._id });
      await status.save();
    }

    res.json({ message: "Status viewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Delete own status ────────────────────────────────
// ─── @route  DELETE /api/status/:id ──────────────────────────
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: "Status not found" });

    if (status.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await status.deleteOne();
    res.json({ message: "Status deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createStatus, getStatuses, viewStatus, deleteStatus };
