import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import Class from "../models/Class.js";
import getDisplayName from "../utils/getDisplayName.js";
import { getLevelTitle } from "../utils/levelTitles.js";
import { validateSpecialization } from "../utils/specializations.js";
import { calculateLevelProgress } from "../utils/levelSystem.js";

export const getMyProfileInformation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "username fullName email phoneCountryCode phoneNumber level xp language timezone gender country nickname avatar displayNamePreference role specialization bio",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateMyProfileInformation = async (req, res) => {
  try {
    const {
      fullName,
      nickname,
      gender,
      country,
      language,
      timezone,
      avatar,
      displayNamePreference,
      bio,
    } = req.body;

    const allowedLanguages = ["english", "indonesian", "malay"];
    const allowedTimezones = ["tokyo", "beijing", "jakarta", "bangkok"];
    const allowedCountries = [
      "indonesia",
      "malaysia",
      "singapore",
      "thailand",
      "japan",
      "china",
    ];
    const allowedGenders = ["male", "female", "other"];
    const allowedDisplayNames = ["fullName", "nickname", "username"];

    if (
      displayNamePreference &&
      !allowedDisplayNames.includes(displayNamePreference)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid display name preference",
      });
    }

    if (language && !allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language option",
      });
    }

    if (country && !allowedCountries.includes(country)) {
      return res.status(400).json({
        success: false,
        message: "Invalid country option",
      });
    }

    if (timezone && !allowedTimezones.includes(timezone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timezone option",
      });
    }

    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender option",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (nickname !== undefined) user.nickname = nickname;
    if (gender !== undefined) user.gender = gender;
    if (country !== undefined) user.country = country;
    if (language !== undefined) user.language = language;
    if (timezone !== undefined) user.timezone = timezone;
    if (avatar !== undefined) user.avatar = avatar;
    if (displayNamePreference !== undefined)
      user.displayNamePreference = displayNamePreference;

    if (user.role === "hybrid" && bio !== undefined) {
      user.bio = bio;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile information updated successfully",
      data: {
        username: user.username,
        fullName: user.fullName,
        nickname: user.nickname,
        gender: user.gender,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        avatar: user.avatar,
        displayNamePreference: user.displayNamePreference,
        role: user.role,
        specialization: user.specialization,
        bio: user.bio,
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

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar file is required",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { returnDocument: "after" },
    ).select("avatar");

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: user.avatar,
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

export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.avatar = "";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
      data: {
        avatar: null,
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

export const getMyShowcase = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("level xp");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const assignments = await Assignment.find({
      "submissions.student": userId,
    }).select("submissions classId");

    const submissions = assignments.flatMap((assignment) =>
      assignment.submissions.filter(
        (s) => s.student.toString() === userId.toString(),
      ),
    );

    const tasksCompleted = submissions.length;
    const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore =
      submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;

    const allAchievements = await Achievement.find({}).sort({
      type: 1,
      createdAt: 1,
      title: 1,
    });

    const userAchievements = await UserAchievement.find({ userId }).sort({
      earnedAt: -1,
    });

    const userAchievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId.toString(), ua]),
    );

    const achievements = allAchievements.map((achievement) => {
      const owned = userAchievementMap.get(achievement._id.toString());

      return {
        _id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon || "",
        type: achievement.type,
        trigger: achievement.trigger,
        conditionValue: achievement.conditionValue,
        rewardXP: achievement.rewardXP || 0,
        rewardPoints: achievement.rewardPoints || 0,
        isUnlocked: !!owned,
        isDisplayed: owned?.isDisplayed || false,
        earnedAt: owned?.earnedAt || null,
      };
    });

    const showcaseAchievements = achievements
      .filter((a) => a.isDisplayed && a.isUnlocked)
      .slice(0, 2);

    const badgesEarned = achievements.filter((a) => a.isUnlocked).length;

    const levelProgress = calculateLevelProgress(user.xp || 0);
    if (user.level !== levelProgress.level) {
      user.level = levelProgress.level;
      await user.save();
    }

    const userClasses = await Class.find({ students: userId })
      .populate("students", "username fullName displayNamePreference level xp")
      .select("title students");

    const classIds = userClasses.map((cls) => cls._id);

    const allClassAssignments = await Assignment.find({
      classId: { $in: classIds },
    }).select("classId submissions");

    const assignmentsByClass = new Map();
    for (const assignment of allClassAssignments) {
      const key = assignment.classId.toString();
      if (!assignmentsByClass.has(key)) assignmentsByClass.set(key, []);
      assignmentsByClass.get(key).push(assignment);
    }

    const leaderboardPreview = userClasses.map((cls) => {
      const clsAssignments = assignmentsByClass.get(cls._id.toString()) || [];

      const scoreMap = new Map();
      cls.students.forEach((student) => {
        scoreMap.set(student._id.toString(), 0);
      });

      clsAssignments.forEach((assignment) => {
        assignment.submissions.forEach((submission) => {
          const studentId = submission.student.toString();
          if (scoreMap.has(studentId)) {
            scoreMap.set(
              studentId,
              scoreMap.get(studentId) + (submission.score || 0),
            );
          }
        });
      });

      const studentsWithPoints = cls.students.map((student) => ({
        ...student.toObject(),
        points: scoreMap.get(student._id.toString()) || 0,
      }));

      studentsWithPoints.sort((a, b) => b.points - a.points);

      const userRank = studentsWithPoints.findIndex(
        (s) => s._id.toString() === userId.toString(),
      );

      let display;
      if (userRank >= 0 && userRank < 5) {
        display = studentsWithPoints.slice(0, 5);
      } else if (userRank >= 5) {
        display = [
          ...studentsWithPoints.slice(0, 4),
          studentsWithPoints[userRank],
        ];
      } else {
        display = studentsWithPoints.slice(0, 5);
      }

      return {
        classId: cls._id,
        className: cls.title,
        leaderboard: display.map((student, index) => ({
          rank: index + 1,
          displayName: getDisplayName(student),
          points: student.points || 0,
          isYou: student._id.toString() === userId.toString(),
        })),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Showcase fetched successfully",
      data: {
        overview: {
          tasksCompleted,
          avgScore,
          badgesEarned,
        },
        levelProgress,
        achievements,
        showcaseAchievements,
        leaderboardPreview,
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

export const toggleDisplayAchievement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: "achievementId is required",
      });
    }

    const userAchievement = await UserAchievement.findOne({
      userId,
      achievementId,
    });

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found for this user",
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
          message: "You can only display up to 2 achievements",
        });
      }

      userAchievement.isDisplayed = true;
    } else {
      userAchievement.isDisplayed = false;
    }

    await userAchievement.save();

    return res.status(200).json({
      success: true,
      message: "Achievement display updated",
      data: {
        achievementId,
        isDisplayed: userAchievement.isDisplayed,
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

export const updateMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const { email, password, phoneCountryCode, phoneNumber } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email) user.email = email;

    if (phoneCountryCode) user.phoneCountryCode = phoneCountryCode;

    if (phoneNumber) user.phoneNumber = phoneNumber;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "email phoneCountryCode phoneNumber role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account fetched successfully",
      data: {
        email: user.email,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber || user.phone,
        role: user.role,
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

export const becomeHybrid = async (req, res) => {
  try {
    const userId = req.user._id;
    const { specialization, bio } = req.body;

    if (!validateSpecialization(specialization)) {
      return res.status(400).json({
        success: false,
        message: "Invalid specialization",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "hybrid") {
      return res.status(400).json({
        success: false,
        message: "User is already a hybrid",
      });
    }

    user.role = "hybrid";
    user.specialization = specialization;
    user.bio = bio || "";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Successfully became a hybrid",
      data: {
        role: user.role,
        specialization: user.specialization,
        bio: user.bio,
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

export const deleteMyAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    await Class.updateMany(
      { students: user._id },
      { $pull: { students: user._id } },
    );

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
