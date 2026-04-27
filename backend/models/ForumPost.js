import mongoose from "mongoose";

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
        }
    },
    {
        timestamps: true,
        _id: false,
    }
);

const forumPostSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
    },
    tag: {
      type: String,
      enum: ["announcement", "resource", "question"],
      required: true,
      default: "question",
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

const ForumPost = mongoose.model("ForumPost", forumPostSchema);

export default ForumPost;