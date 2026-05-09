import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import { isClassTeacher } from "../utils/classAccess.js";

export const createClassAchievement = async (req, res) => {
  try {
    const { classId } = req.params;

    const {
      title,
      description,
      trigger,
      conditionValue,
      rewardXP,
      rewardPoints,
      icon,
    } = req.body;

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
        message: "Only teacher can create achievement",
      });
    }

    const achievement = await Achievement.create({
      title,
      description,
      icon,
      trigger,
      conditionValue,
      rewardXP,
      rewardPoints,
      type: "class",
      classId,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Achievement created",
      data: achievement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const giveClassAchievementEarly = async (req, res) => {
  try {
    const { classId, achievementId } = req.params;
    const { userIds = [] } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be a non-empty array",
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
        message: "Only teacher can give achievement early",
      });
    }

    const achievement = await Achievement.findOne({
      _id: achievementId,
      type: "class",
      classId,
    });

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Class achievement not found",
      });
    }

    const classStudentIds = foundClass.students.map((studentId) =>
      studentId.toString(),
    );

    const validUserIds = userIds
      .map((id) => id.toString())
      .filter((id) => classStudentIds.includes(id));

    if (validUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid class students selected",
      });
    }

    const granted = [];
    const skipped = [];

    for (const userId of validUserIds) {
      const exists = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (exists) {
        skipped.push(userId);
        continue;
      }

      await UserAchievement.create({
        userId,
        achievementId: achievement._id,
        classId,
        earnedAt: new Date(),
      });

      if (achievement.rewardXP) {
        await User.findByIdAndUpdate(userId, {
          $inc: {
            xp: achievement.rewardXP,
          },
        });
      }

      granted.push(userId);
    }

    return res.status(200).json({
      success: true,
      message: "Achievement granted early",
      data: {
        achievementId: achievement._id,
        granted,
        skipped,
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

export const getClassAchievements = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;

    const achievements = await Achievement.find({
      type: "class",
      classId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const achievementIds = achievements.map((achievement) => achievement._id);

    const ownedAchievements = await UserAchievement.find({
      userId,
      achievementId: { $in: achievementIds },
    }).lean();

    const ownedMap = new Map(
      ownedAchievements.map((item) => [item.achievementId.toString(), item]),
    );

    const data = achievements.map((achievement) => {
      const owned = ownedMap.get(achievement._id.toString());

      return {
        ...achievement,
        isUnlocked: !!owned,
        isAchieved: !!owned,
        earnedAt: owned?.earnedAt || null,
        userAchievementId: owned?._id || null,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMyAchievements = async (req, res) => {
  try {
    const achievements = await UserAchievement.find({
      userId: req.user._id,
    })
      .populate("achievementId")
      .sort({ earnedAt: -1 });

    return res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const toggleShowcaseAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user._id;

    const userAchievement = await UserAchievement.findOne({
      userId,
      achievementId,
    });

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not owned",
      });
    }

    if (!userAchievement.isDisplayed) {
      const displayedCount = await UserAchievement.countDocuments({
        userId,
        isDisplayed: true,
      });

      if (displayedCount >= 2) {
        return res.status(400).json({
          success: false,
          message: "Maximum 2 achievements can be displayed",
        });
      }
    }

    userAchievement.isDisplayed = !userAchievement.isDisplayed;

    await userAchievement.save();

    return res.status(200).json({
      success: true,
      message: "Showcase updated",
      data: userAchievement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
