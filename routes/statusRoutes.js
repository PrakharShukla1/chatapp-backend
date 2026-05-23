// routes/statusRoutes.js
const express = require("express");
const router = express.Router();
const { createStatus, getStatuses, viewStatus, deleteStatus } = require("../controllers/statusController");
const { protect } = require("../middleware/authMiddleware");
const { uploadStatus } = require("../config/cloudinary");

router.use(protect);
router.post("/", uploadStatus.single("image"), createStatus);
router.get("/", getStatuses);
router.post("/:id/view", viewStatus);
router.delete("/:id", deleteStatus);

module.exports = router;
