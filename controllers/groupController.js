// controllers/groupController.js - Group Chat Logic
const Group = require("../models/Group");
const Conversation = require("../models/Conversation");
const { uploadAvatar } = require("../config/cloudinary");

// ─── @desc   Create group ─────────────────────────────────────
// ─── @route  POST /api/groups ────────────────────────────────
const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const members = JSON.parse(memberIds || "[]");

    // Admin is always a member
    const allMembers = [...new Set([...members, req.user._id.toString()])];

    // Create conversation first
    const conversation = await Conversation.create({
      participants: allMembers,
      isGroup: true,
    });

    // Create group
    const group = await Group.create({
      name,
      description: description || "",
      admin: req.user._id,
      members: allMembers,
      conversationId: conversation._id,
      avatar: req.file?.path || "",
    });

    // Link conversation to group
    conversation.groupId = group._id;
    await conversation.save();

    await group.populate("members", "name avatar isOnline");
    await group.populate("admin", "name avatar");

    res.status(201).json({ group, conversationId: conversation._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Get group details ────────────────────────────────
// ─── @route  GET /api/groups/:id ─────────────────────────────
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "name avatar isOnline lastSeen")
      .populate("admin", "name avatar");

    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Add member to group ─────────────────────────────
// ─── @route  POST /api/groups/:id/members ────────────────────
const addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only admin can add members
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    const { userId } = req.body;
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push(userId);
    await group.save();

    // Add to conversation participants
    await Conversation.findByIdAndUpdate(group.conversationId, {
      $addToSet: { participants: userId },
    });

    await group.populate("members", "name avatar isOnline");
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Remove member from group ────────────────────────
// ─── @route  DELETE /api/groups/:id/members/:userId ──────────
const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = group.admin.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();

    // Admin can remove anyone, members can only remove themselves
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Not authorized" });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await group.save();

    await Conversation.findByIdAndUpdate(group.conversationId, {
      $pull: { participants: req.params.userId },
    });

    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc   Update group ─────────────────────────────────────
// ─── @route  PUT /api/groups/:id ─────────────────────────────
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    const { name, description } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (req.file) group.avatar = req.file.path;

    await group.save();
    await group.populate("members", "name avatar isOnline");
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getGroup, addMember, removeMember, updateGroup };
