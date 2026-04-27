import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
{
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: [
      "assignment_posted",
      "assignment_graded",
      "forum_reply",
      "forum_upvote",
      "announcement"
    ],
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    default: "",
  },

  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },

  isRead: {
    type: Boolean,
    default: false,
  }
},
{ timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;