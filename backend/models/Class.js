import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          trim: true,
        },
        endTime: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    description: {
      type: String,
      trim: true,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    joinCode: {
      type: String,
      required: [true, "Join code is required"],
      unique: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Class = mongoose.model("Class", classSchema);

export default Class;
