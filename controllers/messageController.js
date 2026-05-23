// controllers/messageController.js

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");


// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
const sendMessage = async (req, res) => {

  try {

    const {
      conversationId,
      receiverId,
      groupId,
      message,
      type,
      replyTo,
    } = req.body;

    let conversation;

    // existing conversation
    if (conversationId) {

      conversation =
        await Conversation.findById(
          conversationId
        );

    } else if (receiverId) {

      // direct chat
      conversation =
        await Conversation.findOne({
          isGroup: false,
          participants: {
            $all: [
              req.user._id,
              receiverId,
            ],
          },
        });

      // create new
      if (!conversation) {

        conversation =
          await Conversation.create({
            participants: [
              req.user._id,
              receiverId,
            ],
            isGroup: false,
          });
      }
    }

    if (!conversation) {

      return res.status(404).json({
        message:
          "Conversation not found",
      });
    }

    // create message object
    const messageData = {

      conversationId:
        conversation._id,

      senderId:
        req.user._id,

      message:
        message || "",

      type:
        type || "text",

      replyTo:
        replyTo || null,

      status: "sent",
    };

    if (receiverId) {

      messageData.receiverId =
        receiverId;
    }

    if (groupId) {

      messageData.groupId =
        groupId;
    }

    // attachment
    if (req.file) {

      messageData.type =
        req.file.mimetype.startsWith(
          "image"
        )
          ? "image"
          : "file";

      messageData.attachment = {

        url: req.file.path,

        publicId:
          req.file.filename,

        fileName:
          req.file.originalname,

        mimeType:
          req.file.mimetype,
      };
    }

    // save
    const newMessage =
      await Message.create(
        messageData
      );

    await newMessage.populate(
      "senderId",
      "name avatar"
    );

    if (replyTo) {

      await newMessage.populate(
        "replyTo"
      );
    }

    // update conversation
    await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        lastMessage:
          newMessage._id,

        updatedAt:
          new Date(),
      }
    );

    // socket emit
    const io =
      req.app.get("io");

    if (io) {

      io.to(
        conversation._id.toString()
      ).emit(
        "receive_message",
        newMessage
      );
    }

    res.status(201).json(
      newMessage
    );

  } catch (error) {

    console.log(
      "SEND MESSAGE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// ─────────────────────────────────────────────
// GET MESSAGES
// ─────────────────────────────────────────────
const getMessages = async (req, res) => {

  try {

    const {
      conversationId,
    } = req.params;

    const messages =
      await Message.find({

        conversationId,

        deletedFor: {
          $nin: [
            req.user._id,
          ],
        },
      })
        .populate(
          "senderId",
          "name avatar"
        )
        .populate(
          "replyTo"
        )
        .sort({
          createdAt: 1,
        });

    res.json(messages);

  } catch (error) {

    console.log(
      "GET MESSAGE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// ─────────────────────────────────────────────
// EDIT MESSAGE
// ─────────────────────────────────────────────
const editMessage = async (req, res) => {

  try {

    const message =
      await Message.findById(
        req.params.id
      );

    if (!message) {

      return res.status(404).json({
        message:
          "Message not found",
      });
    }

    // only sender
    if (
      message.senderId.toString() !==
      req.user._id.toString()
    ) {

      return res.status(403).json({
        message:
          "Not authorized",
      });
    }

    // deleted msg cannot edit
    if (
      message.isDeletedForEveryone
    ) {

      return res.status(400).json({
        message:
          "Cannot edit deleted message",
      });
    }

    message.message =
      req.body.message;

    message.isEdited = true;

    message.editedAt =
      new Date();

    await message.save();

    await message.populate(
      "senderId",
      "name avatar"
    );

    // socket
    const io =
      req.app.get("io");

    if (io) {

      io.to(
        message.conversationId.toString()
      ).emit(
        "message_edited",
        {
          messageId:
            message._id,

          newMessage:
            message.message,
        }
      );
    }

    res.json(message);

  } catch (error) {

    console.log(
      "EDIT MESSAGE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// ─────────────────────────────────────────────
// DELETE MESSAGE
// ─────────────────────────────────────────────
const deleteMessage = async (req, res) => {

  try {

    const {
      deleteFor,
    } = req.query;

    const message =
      await Message.findById(
        req.params.id
      );

    if (!message) {

      return res.status(404).json({
        message:
          "Message not found",
      });
    }

    // init safety
    if (!message.deletedFor) {

      message.deletedFor = [];
    }

    // delete for everyone
    if (
      deleteFor === "everyone"
    ) {

      if (
        message.senderId.toString() !==
        req.user._id.toString()
      ) {

        return res.status(403).json({
          message:
            "Not authorized",
        });
      }

      message.isDeletedForEveryone =
        true;

      message.message =
        "This message was deleted";

      await message.save();

      const io =
        req.app.get("io");

      if (io) {

        io.to(
          message.conversationId.toString()
        ).emit(
          "message_deleted",
          {
            messageId:
              message._id,

            conversationId:
              message.conversationId,

            deleteFor:
              "everyone",
          }
        );
      }

    } else {

      // delete for me
      const alreadyDeleted =
        message.deletedFor.some(
          (id) =>
            id.toString() ===
            req.user._id.toString()
        );

      if (!alreadyDeleted) {

        message.deletedFor.push(
          req.user._id
        );

        await message.save();
      }
    }

    res.json({
      message:
        "Message deleted",
      deleteFor,
    });

  } catch (error) {

    console.log(
      "DELETE MESSAGE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// ─────────────────────────────────────────────
// SEARCH MESSAGE
// ─────────────────────────────────────────────
const searchMessages = async (req, res) => {

  try {

    const {
      conversationId,
    } = req.params;

    const {
      q,
    } = req.query;

    if (!q) {

      return res.json([]);
    }

    const messages =
      await Message.find({

        conversationId,

        message: {
          $regex: q,
          $options: "i",
        },

        isDeletedForEveryone:
          false,

        deletedFor: {
          $nin: [
            req.user._id,
          ],
        },
      })
        .populate(
          "senderId",
          "name avatar"
        )
        .sort({
          createdAt: -1,
        })
        .limit(50);

    res.json(messages);

  } catch (error) {

    console.log(
      "SEARCH MESSAGE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// ─────────────────────────────────────────────
// MARK AS SEEN
// ─────────────────────────────────────────────
const markAsSeen = async (req, res) => {

  try {

    const {
      conversationId,
    } = req.params;

    // unread messages
    const unreadMessages =
      await Message.find({

        conversationId,

        senderId: {
          $ne: req.user._id,
        },

        status: {
          $ne: "seen",
        },
      });

    // update database
    await Message.updateMany(
      {
        conversationId,

        senderId: {
          $ne: req.user._id,
        },

        status: {
          $ne: "seen",
        },
      },
      {
        $set: {
          status: "seen",
        },
      }
    );

    // realtime emit
    const io =
      req.app.get("io");

    if (io) {

      unreadMessages.forEach(
        (msg) => {

          io.to(
            conversationId.toString()
          ).emit(
            "message_status_update",
            {
              messageId:
                msg._id.toString(),

              status:
                "seen",
            }
          );
        }
      );
    }

    res.json({
      success: true,
    });

  } catch (error) {

    console.log(
      "READ STATUS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};
module.exports = {

  sendMessage,

  getMessages,

  editMessage,

  deleteMessage,

  searchMessages,

  markAsSeen,
};