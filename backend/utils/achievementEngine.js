import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { calculateLevelProgress } from "./levelSystem.js";

export const checkAchievements = async ({
  userId,
  trigger,
  classId = null,
}) => {
  const user = await User.findById(userId);

  if (!user) return [];

  let value = 0;

  switch (trigger) {
    case "create_forum":
      value = user.stats.forumPosts;
      break;

    case "reply_forum":
      value = user.stats.forumReplies;
      break;

    case "get_forum_upvote":
      value = user.stats.forumUpvotes;
      break;

    case "submit_assignment":
      value = user.stats.assignmentSubmissions;
      break;

    default:
      return [];
  }

  const achievements = await Achievement.find({
    trigger,
    $or: [{ type: "general" }, { type: "class", classId }],
  });

  const unlocked = [];

  for (const achievement of achievements) {
    if (value < achievement.conditionValue) continue;

    const exists = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id,
    });

    if (exists) continue;

    const newAchievement = await UserAchievement.create({
      userId,
      achievementId: achievement._id,
      classId: achievement.type === "class" ? classId : null,
      earnedAt: new Date(),
    });

    // 🔥 kasih reward XP
    if (achievement.rewardXP) {
      user.xp = (user.xp || 0) + achievement.rewardXP;

      const levelProgress = calculateLevelProgress(user.xp);
      user.level = levelProgress.level;
    }

    unlocked.push(achievement);
  }

  await user.save();

  return unlocked;
};
