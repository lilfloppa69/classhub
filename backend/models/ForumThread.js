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
  { _id: false }
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
      required: true,
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
  },
  {
    timestamps: true,
  }
);

const forumThreadSchema = new mongoose.Schema(
  {
    forumType: {
      type: String,
      enum: ["general", "class"],
      required: true,
    },
    generalForumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneralForum",
      default: null,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Thread title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Thread content is required"],
      trim: true,
    },
    tag: {
      type: String,
      enum: ["announcement", "resource", "question"],
      required: true,
      default: "question",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  }
);

const ForumThread = mongoose.model("ForumThread", forumThreadSchema);

export default ForumThread;