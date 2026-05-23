// controllers/userController.js - User Management

const User = require("../models/User");

// ─── @desc   Get all users (for search/new chat) ───────────────
// ─── @route  GET /api/users ───────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
          _id: { $ne: req.user._id },
        }
      : {
          _id: { $ne: req.user._id },
        };

    const users = await User.find(query)
      .select("-password")
      .limit(20)
      .sort({ isOnline: -1, name: 1 });

    res.json(users);

  } catch (error) {

    console.log("GET USERS ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ─── @desc   Get user by ID ───────────────────────────────────
// ─── @route  GET /api/users/:id ──────────────────────────────
const getUserById = async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {

    console.log("GET USER ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ─── @desc   Update profile ───────────────────────────────────
// ─── @route  PUT /api/users/profile ──────────────────────────
const updateProfile = async (req, res) => {
  try {

    console.log("PROFILE UPDATE HIT");

    const { name, bio } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // update fields
    if (name) {
      user.name = name;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    // avatar upload
    if (req.file) {

      console.log("Uploaded File:", req.file);

      // IMPORTANT
      // use secure_url if cloudinary storage is used
      user.avatar =
        req.file.path ||
        req.file.secure_url ||
        req.file.url;
    }

    const updatedUser = await user.save();

    console.log("PROFILE UPDATED SUCCESS");

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      isOnline: updatedUser.isOnline,
    });

  } catch (error) {

    console.log("PROFILE BACKEND ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ─── @desc   Change password ──────────────────────────────────
// ─── @route  PUT /api/users/password ─────────────────────────
const changePassword = async (req, res) => {
  try {

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;

    await user.save();

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {

    console.log("PASSWORD ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ─── @desc   Block/Unblock user ───────────────────────────────
// ─── @route  PUT /api/users/block/:id ────────────────────────
const toggleBlock = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    const targetId = req.params.id;

    const isBlocked = user.blockedUsers.includes(targetId);

    if (isBlocked) {

      user.blockedUsers = user.blockedUsers.filter(
        (id) => id.toString() !== targetId
      );

    } else {

      user.blockedUsers.push(targetId);

    }

    await user.save();

    res.json({
      message: isBlocked
        ? "User unblocked"
        : "User blocked",
      isBlocked: !isBlocked,
    });

  } catch (error) {

    console.log("BLOCK ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  changePassword,
  toggleBlock,
};