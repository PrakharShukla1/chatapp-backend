// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const { createGroup, getGroup, addMember, removeMember, updateGroup } = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../config/cloudinary");

router.use(protect);
router.post("/", uploadAvatar.single("avatar"), createGroup);
router.get("/:id", getGroup);
router.put("/:id", uploadAvatar.single("avatar"), updateGroup);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;
