import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
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
    preview: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    files: {
      type: [fileSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
    },

    xp: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["assigned", "submitted", "failed", "evaluated"],
      default: "assigned",
    },

    evaluation: {
      requiredObjectives: {
        type: [Boolean],
        default: [],
      },

      bonusObjectives: {
        type: [Boolean],
        default: [],
      },

      autoRules: {
        type: [Boolean],
        default: [],
      },

      autoGradingDisabled: {
        type: Boolean,
        default: false,
      },

      teacherComment: {
        type: String,
        default: "",
      },
    },

    activityHistory: [
      {
        type: {
          type: String,
          enum: ["assigned", "submitted", "cancelled"],
        },

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { _id: false },
);

const objectiveSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const submissionRulesSchema = new mongoose.Schema(
  {
    allowedFileTypes: {
      type: [String],
      default: [],
    },
    maxFileSize: {
      type: Number,
      default: 0,
    },
    maxFiles: {
      type: Number,
      default: 0,
    },
    namingFormat: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const autoGradingRuleSchema = new mongoose.Schema(
  {
    ruleType: {
      type: String,
      enum: [
        "fileName",
        "fileFormat",
        "fileNameAndFormat",
        "fileNumber",
        "keyword",
      ],
      required: true,
    },

    value: {
      type: String,
      default: "",
    },

    score: {
      type: Number,
      default: 0,
    },

    xp: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const assignmentCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    parentCommentId: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "General",
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maximumScore: {
      type: Number,
      default: 0,
    },
    requiredObjectives: {
      type: [objectiveSchema],
      default: [],
    },
    bonusObjectives: {
      type: [objectiveSchema],
      default: [],
    },
    submissionRules: {
      type: submissionRulesSchema,
      default: () => ({}),
    },
    teacherFiles: {
      type: [fileSchema],
      default: [],
    },
    submissions: {
      type: [submissionSchema],
      default: [],
    },
    assignedStudents: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    autoGradingRules: {
      type: [autoGradingRuleSchema],
      default: [],
    },
    comments: {
      type: [assignmentCommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
