import Achievement from "../models/Achievement.js";

export const seedAchievements = async () => {
  const achievements = [
    {
      title: "First Post",
      description: "Create your first forum post",
      trigger: "create_forum",
      conditionValue: 1,
      rewardXP: 500,
      rewardPoints: 5,
      type: "general",
    },

    {
      title: "Forum Starter",
      description: "Create 5 forum posts",
      trigger: "create_forum",
      conditionValue: 5,
      rewardXP: 1000,
      rewardPoints: 10,
      type: "general",
    },

    {
      title: "Forum Master",
      description: "Create 10 forum posts",
      trigger: "create_forum",
      conditionValue: 10,
      rewardXP: 1500,
      rewardPoints: 20,
      type: "general",
    },

    {
      title: "Active Member",
      description: "Reply to 5 forum discussions",
      trigger: "reply_forum",
      conditionValue: 5,
      rewardXP: 1000,
      rewardPoints: 10,
      type: "general",
    },

    {
      title: "Helpful Student",
      description: "Receive 10 forum upvotes",
      trigger: "get_forum_upvote",
      conditionValue: 10,
      rewardXP: 1500,
      rewardPoints: 15,
      type: "general",
    },

    {
      title: "First Submission",
      description: "Submit your first assignment",
      trigger: "submit_assignment",
      conditionValue: 1,
      rewardXP: 500,
      rewardPoints: 5,
      type: "general",
    },

    {
      title: "Hard Worker",
      description: "Submit 5 assignments",
      trigger: "submit_assignment",
      conditionValue: 5,
      rewardXP: 1700,
      rewardPoints: 15,
      type: "general",
    },

    {
      title: "Assignment Hero",
      description: "Submit 10 assignments",
      trigger: "submit_assignment",
      conditionValue: 10,
      rewardXP: 3000,
      rewardPoints: 30,
      type: "general",
    },
  ];

  for (const a of achievements) {
    await Achievement.updateOne(
      {
        title: a.title,
        type: a.type,
        trigger: a.trigger,
        conditionValue: a.conditionValue,
      },
      {
        $set: {
          title: a.title,
          description: a.description,
          icon: a.icon || "",
          type: a.type,
          classId: a.classId || null,
          trigger: a.trigger,
          conditionValue: a.conditionValue,
          rewardXP: a.rewardXP,
          rewardPoints: a.rewardPoints,
          createdBy: a.createdBy || null,
        },
      },
      { upsert: true },
    );
  }

  console.log("System achievements seeded");
};
