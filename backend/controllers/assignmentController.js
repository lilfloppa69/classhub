import Assignment from "../models/Assignment.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import { checkAchievements } from "../utils/achievementEngine.js";
import { isClassTeacher, isClassStudent } from "../utils/classAccess.js";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfWeek = (date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getLastWeekRange = (date) => {
  const startCurrent = startOfWeek(date);
  const startLast = new Date(startCurrent);
  startLast.setDate(startCurrent.getDate() - 7);
  const endLast = new Date(startCurrent);
  endLast.setMilliseconds(-1);

  return {
    start: startLast,
    end: endLast,
  };
};

const getNextWeekRange = (date) => {
  const endCurrent = endOfWeek(date);
  const startNext = new Date(endCurrent);
  startNext.setMilliseconds(endCurrent.getMilliseconds() + 1);

  const endNext = new Date(startNext);
  endNext.setDate(startNext.getDate() + 6);
  endNext.setHours(23, 59, 59, 999);

  return {
    start: startNext,
    end: endNext,
  };
};

const buildTaskCard = (assignment, className, extra = {}) => ({
  _id: assignment._id,
  assignmentId: assignment._id,
  title: assignment.title,
  classId: assignment.classId?._id || assignment.classId,
  className,
  assignedAt: assignment.assignedAt,
  createdAt: assignment.createdAt,
  dueDate: assignment.dueDate,
  ...extra,
});

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const getFileExtension = (name = "") => {
  const lower = String(name).toLowerCase().trim();
  const lastDot = lower.lastIndexOf(".");

  if (lastDot === -1) return "";
  return lower.slice(lastDot + 1);
};

const getBaseFileName = (name = "") => {
  const lower = String(name).toLowerCase().trim();
  const lastDot = lower.lastIndexOf(".");

  if (lastDot === -1) return lower;
  return lower.slice(0, lastDot);
};

export const getMyTasks = async (req, res) => {
  try {
    if (req.user.role === "teacher") {
      return res.status(200).json({
        success: true,
        message: "Teachers do not have assigned tasks",
        data: {
          assigned: {
            noDueDate: [],
            thisWeek: [],
            nextWeek: [],
            later: [],
          },
          notSubmitted: {
            thisWeek: [],
            lastWeek: [],
            earlier: [],
          },
          completed: {
            noDueDate: [],
            completedEarly: [],
            thisWeek: [],
            lastWeek: [],
            earlier: [],
          },
        },
      });
    }

    const myClasses = await Class.find({
      students: req.user._id,
    }).select("_id title subject");

    const myClassIds = myClasses.map((cls) => cls._id);

    const assignments = await Assignment.find({
      classId: { $in: myClassIds },
      $or: [
        { assignedStudents: { $size: 0 } }, // semua siswa
        { assignedStudents: req.user._id }, // siswa tertentu
      ],
    })
      .populate("classId", "title subject")
      .sort({ createdAt: -1 });

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = endOfWeek(now);
    const lastWeek = getLastWeekRange(now);
    const nextWeek = getNextWeekRange(now);

    const groupedTasks = {
      assigned: {
        noDueDate: [],
        thisWeek: [],
        nextWeek: [],
        later: [],
      },
      notSubmitted: {
        thisWeek: [],
        lastWeek: [],
        earlier: [],
      },
      completed: {
        noDueDate: [],
        completedEarly: [],
        thisWeek: [],
        lastWeek: [],
        earlier: [],
      },
    };

    assignments.forEach((assignment) => {
      const className =
        assignment.classId?.title ??
        assignment.classId?.subject ??
        "Unknown Class";

      const mySubmission = assignment.submissions.find(
        (submission) =>
          submission.student.toString() === req.user._id.toString(),
      );

      const isSubmitted = !!mySubmission && !!mySubmission.submittedAt;
      const hasDueDate = !!assignment.dueDate;
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

      if (isSubmitted) {
        const submittedAt = new Date(mySubmission.submittedAt);

        const completedCard = buildTaskCard(assignment, className, {
          submittedAt: mySubmission.submittedAt,
          statusText: "Submitted",
        });

        if (!hasDueDate) {
          groupedTasks.completed.noDueDate.push(completedCard);
        } else if (submittedAt < dueDate) {
          groupedTasks.completed.completedEarly.push(completedCard);
        } else if (submittedAt >= thisWeekStart && submittedAt <= thisWeekEnd) {
          groupedTasks.completed.thisWeek.push(completedCard);
        } else if (
          submittedAt >= lastWeek.start &&
          submittedAt <= lastWeek.end
        ) {
          groupedTasks.completed.lastWeek.push(completedCard);
        } else {
          groupedTasks.completed.earlier.push(completedCard);
        }

        return;
      }

      if (!hasDueDate) {
        groupedTasks.assigned.noDueDate.push(
          buildTaskCard(assignment, className),
        );
        return;
      }

      if (dueDate < now) {
        const failedCard = buildTaskCard(assignment, className, {
          statusText: "Failed to submit",
        });

        if (dueDate >= thisWeekStart && dueDate <= thisWeekEnd) {
          groupedTasks.notSubmitted.thisWeek.push(failedCard);
        } else if (dueDate >= lastWeek.start && dueDate <= lastWeek.end) {
          groupedTasks.notSubmitted.lastWeek.push(failedCard);
        } else {
          groupedTasks.notSubmitted.earlier.push(failedCard);
        }

        return;
      }

      const assignedCard = buildTaskCard(assignment, className);

      if (dueDate >= thisWeekStart && dueDate <= thisWeekEnd) {
        groupedTasks.assigned.thisWeek.push(assignedCard);
      } else if (dueDate >= nextWeek.start && dueDate <= nextWeek.end) {
        groupedTasks.assigned.nextWeek.push(assignedCard);
      } else {
        groupedTasks.assigned.later.push(assignedCard);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: groupedTasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const canAccessAssignment = (joinedClass, userId) => {
  const isTeacher = isClassTeacher(joinedClass, userId);
  const isStudentMember = isClassStudent(joinedClass, userId);

  return {
    isTeacher,
    isStudentMember,
    canAccess: isTeacher || isStudentMember,
  };
};

export const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("classId", "title subject teacher coTeachers students")
      .populate("createdBy", "fullName email")
      .populate("comments.author", "fullName email username displayName");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const joinedClass = await Class.findById(assignment.classId._id);

    if (!joinedClass) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this assignment",
      });
    }

    const isTeacherView = isClassTeacher(joinedClass, req.user._id);
    const isStudentMember = isClassStudent(joinedClass, req.user._id);

    if (!isTeacherView && !isStudentMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this assignment",
      });
    }

    const isAssigned =
      assignment.assignedStudents.length === 0 ||
      assignment.assignedStudents.some(
        (id) => id.toString() === req.user._id.toString(),
      );

    if (!isTeacherView && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: "This assignment is not assigned to you",
      });
    }

    const mySubmission = isTeacherView
      ? null
      : assignment.submissions.find(
          (submission) =>
            submission.student.toString() === req.user._id.toString(),
        );

    return res.status(200).json({
      success: true,
      message: "Assignment fetched successfully",
      data: {
        _id: assignment._id,
        title: assignment.title,
        instructions: assignment.instructions,
        assignedAt: assignment.assignedAt,
        dueDate: assignment.dueDate,

        class: assignment.classId,
        author: assignment.createdBy,

        maximumScore: assignment.maximumScore,
        requiredObjectives: assignment.requiredObjectives,
        bonusObjectives: assignment.bonusObjectives,
        autoGradingRules: assignment.autoGradingRules,
        teacherFiles: assignment.teacherFiles,

        submissionRules: assignment.submissionRules,

        submission: mySubmission || null,
        comments: assignment.comments || [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const createAssignmentComment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, parentCommentId = null } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const assignment = await Assignment.findById(assignmentId).populate(
      "classId",
      "teacher coTeachers students",
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const access = canAccessAssignment(assignment.classId, req.user._id);

    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this assignment",
      });
    }

    if (parentCommentId) {
      const parentExists = assignment.comments.some(
        (comment) => String(comment._id) === String(parentCommentId),
      );

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    assignment.comments.push({
      author: req.user._id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
    });

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignmentId).populate(
      "comments.author",
      "fullName email username displayName",
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: updatedAssignment.comments || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteAssignmentComment = async (req, res) => {
  try {
    const { assignmentId, commentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate(
      "classId",
      "teacher coTeachers students",
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const access = canAccessAssignment(assignment.classId, req.user._id);

    if (!access.canAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this assignment",
      });
    }

    const targetComment = assignment.comments.id(commentId);

    if (!targetComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isAuthor = String(targetComment.author) === String(req.user._id);

    if (!isAuthor) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comment",
      });
    }

    targetComment.content = "";
    targetComment.isDeleted = true;

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignmentId).populate(
      "comments.author",
      "fullName email username displayName",
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: updatedAssignment.comments || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Submission files are required",
      });
    }

    const assignment = await Assignment.findById(assignmentId).populate(
      "classId",
      "teacher coTeachers students",
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const isTeacher = isClassTeacher(assignment.classId, req.user._id);
    const isStudent = isClassStudent(assignment.classId, req.user._id);

    if (isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Teachers cannot submit assignments",
      });
    }

    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: "Only students can submit assignments",
      });
    }

    const rules = assignment.submissionRules || {};
    const allowedFileTypes = rules.allowedFileTypes || [];
    const maxFiles = rules.maxFiles || 0;

    if (maxFiles && files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed`,
      });
    }

    for (const file of files) {
      if (!file.url || !file.fileType) {
        return res.status(400).json({
          success: false,
          message: "Each file must include url and fileType",
        });
      }

      if (
        allowedFileTypes.length > 0 &&
        !allowedFileTypes.includes(file.fileType)
      ) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.fileType} is not allowed`,
        });
      }
    }

    const isAssigned =
      assignment.assignedStudents.length === 0 ||
      assignment.assignedStudents.some(
        (id) => id.toString() === req.user._id.toString(),
      );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "This assignment is not assigned to you",
      });
    }

    const existingSubmission = assignment.submissions.find(
      (submission) => submission.student.toString() === req.user._id.toString(),
    );

    if (existingSubmission?.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Assignment already submitted. Cancel submission first.",
      });
    }

    const matchedAutoRules = (assignment.autoGradingRules || []).map((rule) => {
      const ruleValue = normalizeText(rule.value);

      if (rule.ruleType === "fileNumber") {
        return files.length === Number(rule.value);
      }

      if (rule.ruleType === "fileNameAndFormat") {
        return files.some((file) => {
          const fileName = normalizeText(file.name || "");
          const fileBase = getBaseFileName(file.name || "");
          const fileExt = getFileExtension(file.name || "");

          // support 2 format:
          // 1. "server.js"
          // 2. "server|js"
          if (ruleValue.includes("|")) {
            const [expectedBase, expectedExt] = ruleValue
              .split("|")
              .map(normalizeText);
            return fileBase === expectedBase && fileExt === expectedExt;
          }

          return fileName === ruleValue;
        });
      }

      if (rule.ruleType === "fileFormat") {
        return files.some((file) => {
          const fileExt = getFileExtension(file.name || "");
          const fileType = normalizeText(file.fileType || "");
          return fileExt === ruleValue || fileType === ruleValue;
        });
      }

      if (rule.ruleType === "fileName") {
        return files.some((file) => {
          const fileName = normalizeText(file.name || "");
          const fileBase = getBaseFileName(file.name || "");
          return fileName === ruleValue || fileBase === ruleValue;
        });
      }

      if (rule.ruleType === "keyword") {
        return files.some((file) =>
          normalizeText(file.name || "").includes(ruleValue),
        );
      }

      return false;
    });

    if (existingSubmission) {
      existingSubmission.files = files;
      existingSubmission.submittedAt = new Date();
      existingSubmission.status = "submitted";
      existingSubmission.score = 0;
      existingSubmission.xp = 0;

      if (!existingSubmission.evaluation) {
        existingSubmission.evaluation = {};
      }

      existingSubmission.evaluation.autoRules = matchedAutoRules;
      existingSubmission.activityHistory.push({
        type: "submitted",
        date: new Date(),
      });
    } else {
      assignment.submissions.push({
        student: req.user._id,
        files,
        submittedAt: new Date(),
        status: "submitted",
        score: 0,
        xp: 0,
        evaluation: {
          requiredObjectives: [],
          bonusObjectives: [],
          autoRules: matchedAutoRules,
          autoGradingDisabled: false,
          teacherComment: "",
        },
        activityHistory: [
          {
            type: "submitted",
            date: new Date(),
          },
        ],
      });
    }

    await assignment.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.assignmentSubmissions": 1 },
    });

    await checkAchievements({
      userId: req.user._id,
      trigger: "submit_assignment",
      classId: assignment.classId,
    });

    const mySubmission = assignment.submissions.find(
      (submission) => submission.student.toString() === req.user._id.toString(),
    );
    return res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
      data: mySubmission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const cancelSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate(
      "classId",
      "teacher coTeachers students",
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const isTeacher = isClassTeacher(assignment.classId, req.user._id);
    const isStudent = isClassStudent(assignment.classId, req.user._id);

    if (isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Teachers cannot cancel submissions",
      });
    }

    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: "Only students can cancel submissions",
      });
    }

    const submission = assignment.submissions.find(
      (item) => item.student.toString() === req.user._id.toString(),
    );

    if (!submission || !submission.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "No submitted assignment to cancel",
      });
    }

    if (submission.status === "evaluated") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel evaluated submission",
      });
    }

    const isPastDue =
      assignment.dueDate && new Date(assignment.dueDate) < new Date();

    submission.files = [];
    submission.submittedAt = null;
    submission.score = 0;
    submission.xp = 0;
    submission.status = isPastDue ? "failed" : "assigned";

    if (!submission.evaluation) {
      submission.evaluation = {};
    }

    submission.evaluation.autoRules = [];
    submission.activityHistory.push({
      type: "cancelled",
      date: new Date(),
    });

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Submission cancelled successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMySubmissionStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .select("dueDate submissions")
      .populate("classId", "teacher coTeachers students");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const isTeacher = isClassTeacher(assignment.classId, req.user._id);
    const isStudent = isClassStudent(assignment.classId, req.user._id);

    if (isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Teachers do not have submission status",
      });
    }

    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: "Only students can access submission status",
      });
    }

    const mySubmission = assignment.submissions.find(
      (submission) => submission.student.toString() === req.user._id.toString(),
    );

    const now = new Date();
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    let status = "assigned";

    if (mySubmission?.submittedAt) {
      status = "submitted";
    } else if (dueDate && dueDate < now) {
      status = "failed";
    }

    return res.status(200).json({
      success: true,
      message: "Submission status fetched successfully",
      data: {
        assignmentId: assignment._id,
        status,
        submittedAt: mySubmission?.submittedAt || null,
        dueDate,
        score: mySubmission?.score || 0,
        xp: mySubmission?.xp || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { classId } = req.params;

    const {
      title,
      topic,
      instructions,
      dueDate,
      maximumScore,
      requiredObjectives = [],
      bonusObjectives = [],
      autoGradingRules = [],
      assignedStudents = [],
      teacherFiles = [],
    } = req.body;

    if (!title || !maximumScore) {
      return res.status(400).json({
        success: false,
        message: "Title and maximum score are required",
      });
    }

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create assignments",
      });
    }

    // VALIDATE TOTAL SCORE
    const requiredScore = requiredObjectives.reduce(
      (sum, obj) => sum + (obj.score || 0),
      0,
    );

    const bonusScore = bonusObjectives.reduce(
      (sum, obj) => sum + (obj.score || 0),
      0,
    );

    const ruleScore = autoGradingRules.reduce(
      (sum, rule) => sum + (rule.score || 0),
      0,
    );

    const totalScore = requiredScore + bonusScore + ruleScore;

    if (totalScore > maximumScore) {
      return res.status(400).json({
        success: false,
        message: "Total objectives and auto grading score exceed maximum score",
      });
    }

    // DETERMINE ASSIGNED STUDENTS
    const classStudentIds = foundClass.students.map((studentId) =>
      studentId.toString(),
    );

    const isAssignedToAll =
      !Array.isArray(assignedStudents) || assignedStudents.length === 0;

    const targetStudentIds = isAssignedToAll
      ? classStudentIds
      : assignedStudents
          .map((studentId) => studentId.toString())
          .filter((studentId) => classStudentIds.includes(studentId));

    if (!isAssignedToAll && targetStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid students selected",
      });
    }

    const submissions = targetStudentIds.map((studentId) => ({
      student: studentId,
      status: "assigned",
      files: [],
      score: 0,
      xp: 0,
      submittedAt: null,
      evaluation: {
        requiredObjectives: [],
        bonusObjectives: [],
        autoRules: [],
        autoGradingDisabled: false,
        teacherComment: "",
      },
      activityHistory: [
        {
          type: "assigned",
          date: new Date(),
        },
      ],
    }));

    const assignment = await Assignment.create({
      title: title.trim(),
      topic: topic || "General",
      instructions: instructions || "",
      dueDate: dueDate || null,
      classId,
      createdBy: req.user._id,
      maximumScore,
      requiredObjectives,
      bonusObjectives,
      autoGradingRules,
      teacherFiles,
      assignedStudents: isAssignedToAll ? [] : targetStudentIds,
      submissions,
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const foundClass = await Class.findById(assignment.classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can edit assignment",
      });
    }

    const {
      title,
      topic,
      instructions,
      dueDate,
      maximumScore,
      requiredObjectives,
      bonusObjectives,
      submissionRules,
      teacherFiles,
      assignedStudents,
      autoGradingRules,
    } = req.body;

    if (title !== undefined) assignment.title = title.trim();
    if (topic !== undefined) assignment.topic = topic.trim() || "General";
    if (instructions !== undefined)
      assignment.instructions = instructions.trim();
    if (dueDate !== undefined) assignment.dueDate = dueDate || null;
    if (maximumScore !== undefined)
      assignment.maximumScore = Number(maximumScore) || 0;

    if (requiredObjectives !== undefined) {
      assignment.requiredObjectives = requiredObjectives;
    }

    if (bonusObjectives !== undefined) {
      assignment.bonusObjectives = bonusObjectives;
    }

    if (submissionRules !== undefined) {
      assignment.submissionRules = submissionRules;
    }

    if (teacherFiles !== undefined) {
      assignment.teacherFiles = teacherFiles;
    }

    if (autoGradingRules !== undefined) {
      assignment.autoGradingRules = autoGradingRules;
    }

    const classStudentIds = foundClass.students.map((id) => id.toString());

    const isAssignedToAll =
      !Array.isArray(assignedStudents) || assignedStudents.length === 0;

    const targetStudentIds = isAssignedToAll
      ? classStudentIds
      : assignedStudents
          .map((id) => id.toString())
          .filter((id) => classStudentIds.includes(id));

    if (!isAssignedToAll && targetStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid students selected",
      });
    }

    assignment.assignedStudents = isAssignedToAll ? [] : targetStudentIds;

    const existingSubmissionMap = new Map(
      assignment.submissions.map((submission) => [
        submission.student.toString(),
        submission,
      ]),
    );

    assignment.submissions = targetStudentIds.map((studentId) => {
      const existingSubmission = existingSubmissionMap.get(studentId);

      if (existingSubmission) {
        return existingSubmission;
      }

      return {
        student: studentId,
        files: [],
        submittedAt: null,
        score: 0,
        xp: 0,
        status: "assigned",
        evaluation: {
          requiredObjectives: [],
          bonusObjectives: [],
          autoRules: [],
          autoGradingDisabled: false,
          teacherComment: "",
        },
        activityHistory: [
          {
            type: "assigned",
            date: new Date(),
          },
        ],
      };
    });

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const uploadAssignmentFile = async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can upload assignment files",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.file;
    const rawPath = file.path || "";
    const fileUrl = rawPath
      ? `${req.protocol}://${req.get("host")}/${rawPath.replace(/\\/g, "/")}`
      : file.secure_url || file.location || "";

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        message: "Uploaded file URL not found",
      });
    }

    const mimeType = file.mimetype || "";
    const originalName = file.originalname || file.filename || "attachment";

    let fileType = "file";

    if (mimeType.startsWith("image/")) {
      fileType = "image";
    } else if (mimeType.includes("pdf")) {
      fileType = "pdf";
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      fileType = "document";
    } else if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      fileType = "spreadsheet";
    } else if (
      mimeType.includes("presentation") ||
      mimeType.includes("powerpoint")
    ) {
      fileType = "presentation";
    }

    return res.status(200).json({
      success: true,
      message: "Assignment file uploaded successfully",
      data: {
        url: fileUrl,
        name: originalName,
        fileType,
        preview: fileType === "image" ? fileUrl : "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAssignmentStudents = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("classId", "teacher coTeachers students")
      .populate("submissions.student", "fullName email username");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const classData = await Class.findById(assignment.classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(classData, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can access evaluation",
      });
    }

    const students = assignment.submissions.map((submission) => {
      let status = "assigned";

      if (submission.submittedAt) {
        status = "submitted";
      }

      if (
        !submission.submittedAt &&
        assignment.dueDate &&
        new Date(assignment.dueDate) < new Date()
      ) {
        status = "failed";
      }

      return {
        studentId: submission.student._id,
        name: submission.student.fullName,
        email: submission.student.email,
        username: submission.student.username,
        status,
        submittedAt: submission.submittedAt,
        score: submission.score,
        xp: submission.xp,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      data: students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const uploadSubmissionFile = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate(
      "classId",
      "teacher coTeachers students",
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const isTeacher = isClassTeacher(assignment.classId, req.user._id);
    const isStudent = isClassStudent(assignment.classId, req.user._id);

    if (isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Teachers cannot upload submission files",
      });
    }

    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: "Only students can upload submission files",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.file;
    const rawPath = file.path || "";
    const fileUrl = rawPath
      ? `${req.protocol}://${req.get("host")}/${rawPath.replace(/\\/g, "/")}`
      : file.secure_url || file.location || "";

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        message: "Uploaded file URL not found",
      });
    }

    const mimeType = file.mimetype || "";
    const originalName =
      file.originalname || file.filename || "submission-file";

    let fileType = "file";

    if (mimeType.startsWith("image/")) {
      fileType = "image";
    } else if (mimeType.includes("pdf")) {
      fileType = "pdf";
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      fileType = "document";
    } else if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      fileType = "spreadsheet";
    } else if (
      mimeType.includes("presentation") ||
      mimeType.includes("powerpoint")
    ) {
      fileType = "presentation";
    }

    return res.status(200).json({
      success: true,
      message: "Submission file uploaded successfully",
      data: {
        url: fileUrl,
        name: originalName,
        fileType,
        preview: fileType === "image" ? fileUrl : "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getSubmissionForEvaluation = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("classId")
      .populate("submissions.student", "fullName email username");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const foundClass = await Class.findById(assignment.classId);
    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can evaluate",
      });
    }

    const submission = assignment.submissions.find(
      (s) => s.student._id.toString() === studentId,
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission fetched successfully",
      data: {
        student: submission.student,

        files: submission.files || [],

        activityHistory: submission.activityHistory || [],

        submittedAt: submission.submittedAt,
        status: submission.status || "assigned",

        score: submission.score || 0,
        xp: submission.xp || 0,

        evaluation: submission.evaluation || {
          requiredObjectives: [],
          bonusObjectives: [],
          autoRules: [],
          autoGradingDisabled: false,
          teacherComment: "",
        },

        maximumScore: assignment.maximumScore || 0,
        requiredObjectives: assignment.requiredObjectives || [],
        bonusObjectives: assignment.bonusObjectives || [],
        autoGradingRules: assignment.autoGradingRules || [],

        dueDate: assignment.dueDate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const evaluateSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const {
      checkedObjectives = [],
      checkedBonusObjectives = [],
      autoGradingDisabled = false,
      overrideScore,
      overrideXP,
      comment,
    } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const foundClass = await Class.findById(assignment.classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can evaluate",
      });
    }

    const submission = assignment.submissions.find(
      (s) => s.student.toString() === studentId,
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    let scoreFromObjectives = 0;
    let xpFromObjectives = 0;

    checkedObjectives.forEach((index) => {
      const obj = assignment.requiredObjectives[index];
      if (obj) {
        scoreFromObjectives += obj.score || 0;
        xpFromObjectives += obj.xp || 0;
      }
    });

    checkedBonusObjectives.forEach((index) => {
      const obj = assignment.bonusObjectives[index];
      if (obj) {
        scoreFromObjectives += obj.score || 0;
        xpFromObjectives += obj.xp || 0;
      }
    });

    let scoreFromAutoRules = 0;
    let xpFromAutoRules = 0;

    const systemAutoRules = submission.evaluation?.autoRules || [];

    if (!autoGradingDisabled) {
      systemAutoRules.forEach((matched, index) => {
        if (!matched) return;

        const rule = assignment.autoGradingRules[index];
        if (rule) {
          scoreFromAutoRules += rule.score || 0;
          xpFromAutoRules += rule.xp || 0;
        }
      });
    }

    let score = scoreFromObjectives + scoreFromAutoRules;
    let xp = xpFromObjectives + xpFromAutoRules;

    if (
      overrideScore !== undefined &&
      overrideScore !== null &&
      overrideScore !== ""
    ) {
      score = Number(overrideScore);
    }

    if (overrideXP !== undefined && overrideXP !== null && overrideXP !== "") {
      xp = Number(overrideXP);
    }

    if (score > assignment.maximumScore) {
      score = assignment.maximumScore;
    }

    if (score < 0) score = 0;
    if (xp < 0) xp = 0;

    submission.score = score;
    submission.xp = xp;
    submission.status = "evaluated";

    if (!submission.evaluation) {
      submission.evaluation = {};
    }

    submission.evaluation.requiredObjectives =
      assignment.requiredObjectives.map((_, index) =>
        checkedObjectives.includes(index),
      );

    submission.evaluation.bonusObjectives = assignment.bonusObjectives.map(
      (_, index) => checkedBonusObjectives.includes(index),
    );

    submission.evaluation.autoRules = systemAutoRules;

    submission.evaluation.autoGradingDisabled = !!autoGradingDisabled;

    if (comment !== undefined) {
      submission.evaluation.teacherComment = comment;
    }

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Submission evaluated successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const cancelReturnedSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const foundClass = await Class.findById(assignment.classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can cancel returned submission",
      });
    }

    const submission = assignment.submissions.find(
      (s) => s.student.toString() === studentId,
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    submission.score = 0;
    submission.status = submission.submittedAt ? "submitted" : "assigned";

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Returned submission cancelled successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const evaluateAllSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { score, xp } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const foundClass = await Class.findById(assignment.classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can evaluate",
      });
    }

    assignment.submissions.forEach((submission) => {
      submission.score =
        Number(score || 0) > assignment.maximumScore
          ? assignment.maximumScore
          : Number(score || 0);

      submission.xp = Math.max(Number(xp || 0), 0);
      submission.status = "evaluated";
    });

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "All submissions evaluated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getClassGradebook = async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId)
      .populate(
        "teacher",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate(
        "coTeachers",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate(
        "students",
        "username fullName nickname avatar displayNamePreference",
      );

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);

    if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can access gradebook",
      });
    }

    const assignments = await Assignment.find({ classId })
      .select("title dueDate maximumScore submissions createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const students = foundClass.students.map((student) => {
      const studentId = student._id.toString();

      const grades = assignments.map((assignment) => {
        const submission = assignment.submissions?.find(
          (item) => item.student.toString() === studentId,
        );

        return {
          assignmentId: assignment._id,
          score: submission?.score ?? null,
          xp: submission?.xp ?? 0,
          status: submission?.status || "assigned",
          maximumScore: assignment.maximumScore || 0,
        };
      });

      const gradedScores = grades.filter((item) => item.score !== null);
      const totalScore = gradedScores.reduce(
        (sum, item) => sum + Number(item.score || 0),
        0,
      );

      const totalMaximum = gradedScores.reduce(
        (sum, item) => sum + Number(item.maximumScore || 0),
        0,
      );

      const average =
        totalMaximum > 0 ? Math.round((totalScore / totalMaximum) * 100) : 0;

      return {
        _id: student._id,
        username: student.username,
        fullName: student.fullName,
        nickname: student.nickname,
        avatar: student.avatar || "",
        displayName:
          student.displayName ||
          student.fullName ||
          student.nickname ||
          student.username ||
          "Student",
        grades,
        totalScore,
        average,
      };
    });

    const assignmentAverages = assignments.map((assignment) => {
      const scores = students
        .map((student) =>
          student.grades.find(
            (grade) =>
              grade.assignmentId.toString() === assignment._id.toString(),
          ),
        )
        .filter((grade) => grade && grade.score !== null)
        .map((grade) => Number(grade.score || 0));

      const average =
        scores.length > 0
          ? Math.round(
              scores.reduce((sum, score) => sum + score, 0) / scores.length,
            )
          : null;

      return {
        assignmentId: assignment._id,
        average,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Gradebook fetched successfully",
      data: {
        assignments: assignments.map((assignment) => ({
          _id: assignment._id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          maximumScore: assignment.maximumScore || 0,
        })),
        students,
        assignmentAverages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
