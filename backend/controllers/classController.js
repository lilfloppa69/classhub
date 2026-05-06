import Class from "../models/Class.js";
import { getLevelTitle } from "../utils/levelTitles.js";
import getDisplayName from "../utils/getDisplayName.js";
import Assignment from "../models/Assignment.js";
import generateJoinCode from "../utils/generateJoinCode.js";
import GeneralForum from "../models/GeneralForum.js";
import UserAchievement from "../models/UserAchievement.js";
import {
  isTeacherRole,
  isClassTeacher,
  isClassStudent,
  canAccessClass,
} from "../utils/classAccess.js";

const getShowcaseAchievementMap = async (userIds = []) => {
  const displayedAchievements = await UserAchievement.find({
    userId: { $in: userIds },
    isDisplayed: true,
  })
    .populate("achievementId", "title icon")
    .sort({ earnedAt: -1 });

  const achievementMap = new Map();

  displayedAchievements.forEach((item) => {
    const key = item.userId.toString();

    if (!achievementMap.has(key)) {
      achievementMap.set(key, []);
    }

    achievementMap.get(key).push({
      _id: item.achievementId?._id,
      title: item.achievementId?.title || "Achievement",
      icon: item.achievementId?.icon || "",
    });
  });

  return achievementMap;
};

export const getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      $or: [
        { students: req.user._id },
        { teacher: req.user._id },
        { coTeachers: req.user._id },
      ],
    })
      .populate(
        "teacher",
        "fullName email username nickname avatar displayNamePreference",
      )
      .populate(
        "coTeachers",
        "fullName email username nickname avatar displayNamePreference",
      );
    const grouped = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    classes.forEach((cls) => {
      cls.schedule.forEach((sch) => {
        grouped[sch.day].push({
          _id: cls._id,
          title: cls.title,
          subject: cls.subject,
          teacher: cls.teacher,
          coTeachers: cls.coTeachers || [],
          startTime: sch.startTime,
          endTime: sch.endTime,
        });
      });
    });

    return res.status(200).json({
      success: true,
      message: "Classes grouped by day",
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId)
      .populate(
        "teacher",
        "fullName email username nickname avatar displayNamePreference",
      )
      .populate(
        "students",
        "fullName email username nickname avatar displayNamePreference",
      )
      .populate(
        "coTeachers",
        "fullName email username nickname avatar displayNamePreference",
      );

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const quickAssignments = await Assignment.find({ classId })
      .select("title createdAt")
      .sort({ createdAt: -1 });

    const quickForums = await GeneralForum.find({
      associationType: "class",
      associatedClass: classId,
    })
      .populate("author", "username fullName nickname displayNamePreference")
      .sort({ createdAt: -1 });

    const formattedQuickForums = quickForums.map((forum) => ({
      _id: forum._id,
      title: forum.title,
      description: forum.description,
      tag: forum.tag,
      privacy: forum.privacy,
      createdAt: forum.createdAt,
      author: forum.author
        ? {
            _id: forum.author._id,
            username: forum.author.username,
            fullName: forum.author.fullName,
            nickname: forum.author.nickname,
            avatar: forum.author.avatar || "",
            displayName: getDisplayName(forum.author),
          }
        : null,
      upvoteCount: forum.upvotes.length,
      replyCount: forum.replies.length,
      attachments: forum.attachments,
      hasUpvoted: forum.upvotes.some(
        (id) => id.toString() === req.user._id.toString(),
      ),
    }));

    const isTeacher = isClassTeacher(foundClass, req.user._id);
    const isStudent = isClassStudent(foundClass, req.user._id);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class fetched successfully",
      data: {
        ...foundClass.toObject(),
        quickAssignments,
        quickForums: formattedQuickForums,
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

export const joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    const foundClass = await Class.findOne({ joinCode: joinCode.trim() });

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Invalid join code",
      });
    }

    const isOwner = String(foundClass.teacher) === String(req.user._id);
    const alreadyStudent = foundClass.students.some(
      (studentId) => String(studentId) === String(req.user._id),
    );
    const alreadyCoTeacher = (foundClass.coTeachers || []).some(
      (teacherId) => String(teacherId) === String(req.user._id),
    );

    if (isOwner) {
      return res.status(400).json({
        success: false,
        message: "You already own this class",
      });
    }

    if (req.user.role === "teacher") {
      if (alreadyCoTeacher) {
        return res.status(400).json({
          success: false,
          message: "You already joined this class as co-teacher",
        });
      }

      if (alreadyStudent) {
        foundClass.students = foundClass.students.filter(
          (studentId) => String(studentId) !== String(req.user._id),
        );
      }

      foundClass.coTeachers.push(req.user._id);
      await foundClass.save();

      await Assignment.updateMany(
        { classId: foundClass._id },
        {
          $pull: {
            assignedStudents: req.user._id,
            submissions: { student: req.user._id },
          },
        },
      );

      return res.status(200).json({
        success: true,
        message: alreadyStudent
          ? "Moved from student to co-teacher"
          : "Joined class successfully as co-teacher",
        data: foundClass,
      });
    }

    if (alreadyStudent) {
      return res.status(400).json({
        success: false,
        message: "You already joined this class",
      });
    }

    foundClass.students.push(req.user._id);
    await foundClass.save();

    return res.status(200).json({
      success: true,
      message: "Joined class successfully",
      data: foundClass,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId)
      .populate(
        "teacher",
        "username fullName nickname avatar level displayNamePreference",
      )
      .populate(
        "coTeachers",
        "username fullName nickname avatar level displayNamePreference",
      )
      .populate(
        "students",
        "username fullName nickname avatar level displayNamePreference",
      );

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);
    const isStudent = isClassStudent(foundClass, req.user._id);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }

    const userIds = [
      foundClass.teacher?._id,
      ...(foundClass.coTeachers || []).map((teacher) => teacher._id),
      ...foundClass.students.map((student) => student._id),
    ].filter(Boolean);

    const achievementMap = await getShowcaseAchievementMap(userIds);

    const formatUser = (user) => {
      const level = user.level || 1;
      const displayName = getDisplayName(user);

      return {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar || "",
        displayName,
        level,
        levelTitle: getLevelTitle(level),
        showcaseAchievements:
          achievementMap.get(user._id.toString())?.slice(0, 2) || [],
      };
    };

    return res.status(200).json({
      success: true,
      message: "Class students fetched successfully",
      data: {
        teacher: foundClass.teacher ? formatUser(foundClass.teacher) : null,
        coTeachers: (foundClass.coTeachers || []).map(formatUser),
        classmates: foundClass.students.map(formatUser),
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

export const getClassLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const { search = "", order = "desc" } = req.query;

    const foundClass = await Class.findById(classId)
      .populate(
        "teacher",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate(
        "students",
        "username fullName nickname avatar displayNamePreference level xp",
      );
    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(foundClass, req.user._id);
    const isStudent = isClassStudent(foundClass, req.user._id);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }

    const scoreRows = await Assignment.aggregate([
      { $match: { classId: foundClass._id } },
      { $unwind: "$submissions" },
      {
        $group: {
          _id: "$submissions.student",
          totalPoints: { $sum: { $ifNull: ["$submissions.score", 0] } },
        },
      },
    ]);

    const scoreMap = new Map(
      scoreRows.map((row) => [row._id.toString(), row.totalPoints]),
    );

    const studentIds = foundClass.students.map((student) => student._id);

    const displayedAchievements = await UserAchievement.find({
      userId: { $in: studentIds },
      isDisplayed: true,
    })
      .populate("achievementId", "title icon")
      .sort({ earnedAt: -1 });

    const achievementMap = new Map();

    const earnedAchievements = await UserAchievement.find({
      userId: { $in: studentIds },
    })
      .populate("achievementId", "rewardPoints type classId")
      .lean();

    const achievementPointMap = new Map();

    earnedAchievements.forEach((item) => {
      const achievement = item.achievementId;
      if (!achievement) return;

      const isGeneralAchievement = achievement.type === "general";

      const isThisClassAchievement =
        achievement.type === "class" &&
        achievement.classId &&
        achievement.classId.toString() === classId.toString();

      if (!isGeneralAchievement && !isThisClassAchievement) return;

      const key = item.userId.toString();
      const current = achievementPointMap.get(key) || 0;

      achievementPointMap.set(key, current + (achievement.rewardPoints || 0));
    });

    displayedAchievements.forEach((item) => {
      const key = item.userId.toString();

      if (!achievementMap.has(key)) {
        achievementMap.set(key, []);
      }

      achievementMap.get(key).push({
        _id: item.achievementId?._id,
        title: item.achievementId?.title || "Achievement",
        icon: item.achievementId?.icon || "",
      });
    });

    const formatted = foundClass.students.map((student) => {
      const displayName = getDisplayName(student);

      return {
        _id: student._id,
        username: student.username,
        fullName: student.fullName,
        avatar: student.avatar || "",
        displayName,
        level: student.level || 1,
        xp: student.xp || 0,
        points:
          (scoreMap.get(student._id.toString()) || 0) +
          (achievementPointMap.get(student._id.toString()) || 0),
        showcaseAchievements:
          achievementMap.get(student._id.toString())?.slice(0, 2) || [],
      };
    });

    const filtered = formatted.filter((student) =>
      student.displayName.toLowerCase().includes(search.toLowerCase()),
    );

    filtered.sort((a, b) =>
      order === "asc" ? a.points - b.points : b.points - a.points,
    );

    const ranked = filtered.map((student, index) => ({
      rank: index + 1,
      ...student,
    }));

    return res.status(200).json({
      success: true,
      message: "Class leaderboard fetched successfully",
      data: {
        podium: ranked.slice(0, 3),
        others: ranked.slice(3),
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

export const leaveClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = foundClass.teacher.toString() === req.user._id.toString();

    if (isTeacher) {
      await foundClass.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Class gone, reduced to atoms",
        data: {
          deleted: true,
          classId,
        },
      });
    }

    const isCoTeacher = (foundClass.coTeachers || []).some(
      (teacherId) => String(teacherId) === String(req.user._id),
    );

    if (isCoTeacher) {
      foundClass.coTeachers = foundClass.coTeachers.filter(
        (teacherId) => String(teacherId) !== String(req.user._id),
      );

      await foundClass.save();

      return res.status(200).json({
        success: true,
        message: "You have left the class as co-teacher",
        data: {
          deleted: false,
          classId,
        },
      });
    }

    const isStudent = foundClass.students.some(
      (studentId) => studentId.toString() === req.user._id.toString(),
    );

    if (!isStudent) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    foundClass.students = foundClass.students.filter(
      (studentId) => studentId.toString() !== req.user._id.toString(),
    );

    await foundClass.save();

    return res.status(200).json({
      success: true,
      message: "You have left the class",
      data: {
        deleted: false,
        classId,
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

export const createClass = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create classes",
      });
    }

    const { title, subject, description, schedule } = req.body;

    if (!title || !subject || !schedule || schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, and schedule are required",
      });
    }

    let joinCode = generateJoinCode();

    while (await Class.findOne({ joinCode })) {
      joinCode = generateJoinCode();
    }

    const newClass = await Class.create({
      title: title.trim(),
      subject: subject.trim(),
      description: description?.trim() || "",
      teacher: req.user._id,
      coTeachers: [],
      schedule,
      joinCode,
      students: [],
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: {
        _id: newClass._id,
        title: newClass.title,
        subject: newClass.subject,
        description: newClass.description,
        schedule: newClass.schedule,
        joinCode: newClass.joinCode,
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

export const getClassAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const { topic } = req.query;

    const joinedClass = await Class.findById(classId);

    if (!joinedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isTeacher = isClassTeacher(joinedClass, req.user._id);
    const isStudentMember = isClassStudent(joinedClass, req.user._id);

    if (!isTeacher && !isStudentMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }

    const query = { classId };

    if (!isTeacher) {
      query.$or = [
        { assignedStudents: { $size: 0 } },
        { assignedStudents: req.user._id },
      ];
    }

    if (topic && topic.trim()) {
      query.topic = { $regex: topic.trim(), $options: "i" };
    }

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email");

    const now = new Date();
    const groupedMap = new Map();

    assignments.forEach((assignment) => {
      const groupTopic = assignment.topic ?? "General";

      const mySubmission = isTeacher
        ? null
        : assignment.submissions.find(
            (submission) =>
              submission.student.toString() === req.user._id.toString(),
          );

      let status = "assigned";

      if (mySubmission?.submittedAt) {
        status = "submitted";
      } else if (assignment.dueDate && new Date(assignment.dueDate) < now) {
        status = "failed";
      }

      const assignedCount = assignment.submissions.filter(
        (submission) => submission.status === "assigned",
      ).length;

      const submittedCount = assignment.submissions.filter(
        (submission) =>
          submission.status === "submitted" || submission.submittedAt,
      ).length;

      const failedCount = assignment.submissions.filter(
        (submission) => submission.status === "failed",
      ).length;

      const item = {
        _id: assignment._id,
        title: assignment.title,
        topic: groupTopic,
        postedAt: assignment.assignedAt,
        dueDate: assignment.dueDate,
        status,
        assignedCount,
        submittedCount,
        failedCount,
        teacherFiles: assignment.teacherFiles,
        createdBy: assignment.createdBy,
        maximumScore: assignment.maximumScore,
        requiredObjectives: assignment.requiredObjectives.length,
        bonusObjectives: assignment.bonusObjectives.length,
        autoRules: assignment.autoGradingRules?.length || 0,
        submittedAt: mySubmission?.submittedAt || null,
        score: mySubmission?.score || null,
      };

      if (!groupedMap.has(groupTopic)) {
        groupedMap.set(groupTopic, []);
      }

      groupedMap.get(groupTopic).push(item);
    });

    const groupedAssignments = Array.from(groupedMap.entries()).map(
      ([topicName, assignments]) => ({
        topic: topicName,
        assignments,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Class assignments fetched successfully",
      data: groupedAssignments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
