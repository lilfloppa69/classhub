import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    default: "",
  },

  icon: {
    type: String,
    default: "",
  },

  type: {
    type: String,
    enum: ["general", "class"],
    required: true,
  },

  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    default: null,
  },

  trigger: {
    type: String,
    enum: [
      "create_forum",
      "reply_forum",
      "get_forum_upvote",
      "submit_assignment",
      "complete_assignment",
      "reach_score",
      "manual"
    ],
    required: true
  },

  conditionValue: {
    type: Number,
    default: 1
  },

  rewardXP: {
    type: Number,
    default: 0
  },

  rewardPoints: {
    type: Number,
    default: 0
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }
},
{ timestamps: true }
);

const Achievement = mongoose.model("Achievement", achievementSchema);

export default Achievement;