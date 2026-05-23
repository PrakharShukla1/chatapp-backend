// config/cloudinary.js - Cloudinary Configuration
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for avatars
// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "chatapp/avatars",
  }),
});
// Storage for message attachments
const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "chatapp/attachments",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4"],
    resource_type: file.mimetype.startsWith("video") ? "video" : "auto",
  }),
});

// Storage for status images
const statusStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chatapp/status",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadAvatar = multer({ storage: avatarStorage });
const uploadAttachment = multer({ storage: attachmentStorage });
const uploadStatus = multer({ storage: statusStorage });

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadAttachment,
  uploadStatus,
};
