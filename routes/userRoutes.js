// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getUsers, getUserById, updateProfile, changePassword, toggleBlock } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../config/cloudinary");

router.use(protect); // All user routes require auth

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/profile", uploadAvatar.single("avatar"), updateProfile);
router.put("/password", changePassword);
router.put("/block/:id", toggleBlock);

module.exports = router;
