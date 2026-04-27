import mongoose from "mongoose";

const forumAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const forumReplySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.isDeleted;
      },
      trim: true,
    },
    attachments: {
      type: [forumAttachmentSchema],
      default: [],
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    parentReplyId: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const generalForumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Forum title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Forum description is required"],
      trim: true,
    },
    tag: {
      type: String,
      enum: ["announcement", "resource", "question"],
      required: true,
      default: "question",
    },

    associationType: {
      type: String,
      enum: ["general", "class"],
      default: "general",
    },
    associatedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    privacy: {
      type: String,
      enum: ["public", "password", "invite"],
      required: true,
      default: "public",
    },
    password: {
      type: String,
      default: "",
    },
    inviteLink: {
      type: String,
      default: "",
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    attachments: {
      type: [forumAttachmentSchema],
      default: [],
    },

    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    replies: {
      type: [forumReplySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const GeneralForum = mongoose.model("GeneralForum", generalForumSchema);

export default GeneralForum;
