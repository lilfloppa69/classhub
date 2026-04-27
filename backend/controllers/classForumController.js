import GeneralForum from "../models/GeneralForum.js";
import Class from "../models/Class.js";
import getDisplayName from "../utils/getDisplayName.js";
import path from "path";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkAchievements } from "../utils/achievementEngine.js";

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

const formatDisplayName = (user) => getDisplayName(user);

export const uploadClassForumImage = async (req, res) => {
  try {
    const { classId } = req.params;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/forum-images/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Forum image uploaded successfully",
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
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

const checkClassAccess = async (classId, userId) => {
  const foundClass = await Class.findById(classId);

  if (!foundClass) return { error: "Class not found", status: 404 };

  const isTeacher = foundClass.teacher.toString() === userId.toString();
  const isStudent = foundClass.students.some(
    (studentId) => studentId.toString() === userId.toString(),
  );

  if (!isTeacher && !isStudent) {
    return { error: "You do not have access to this class forum", status: 403 };
  }

  return { foundClass };
};

export const getClassForums = async (req, res) => {
  try {
    const { classId } = req.params;
    const { tag, sort = "recent", search = "" } = req.query;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const query = {
      associationType: "class",
      associatedClass: classId,
    };

    if (tag && ["announcement", "resource", "question"].includes(tag)) {
      query.tag = tag;
    }

    if (search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    let forums = await GeneralForum.find(query)
      .populate(
        "author",
        "username fullName nickname avatar displayNamePreference",
      )
      .sort({ createdAt: -1 });

    let data = forums.map((forum) => ({
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
            displayName: formatDisplayName(forum.author),
          }
        : null,
      upvoteCount: forum.upvotes.length,
      replyCount: forum.replies.length,
      attachments: forum.attachments,
      hasUpvoted: forum.upvotes.some(
        (id) => id.toString() === req.user._id.toString(),
      ),
    }));

    if (sort === "mostReplies") {
      data.sort((a, b) => b.replyCount - a.replyCount);
    } else if (sort === "leastReplies") {
      data.sort((a, b) => a.replyCount - b.replyCount);
    } else {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      message: "Class forums fetched successfully",
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

export const createClassForum = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, tag, attachments = [] } = req.body;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    if (!title || !description || !tag) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and tag are required",
      });
    }

    if (!["announcement", "resource", "question"].includes(tag)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tag",
      });
    }

    const forum = await GeneralForum.create({
      title: title.trim(),
      description: description.trim(),
      tag,
      associationType: "class",
      associatedClass: classId,
      privacy: "public",
      password: "",
      inviteLink: "",
      author: req.user._id,
      attachments,
      upvotes: [],
      replies: [],
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.forumPosts": 1 },
    });

    await checkAchievements({
      userId: req.user._id,
      trigger: "create_forum",
      classId,
    });

    const populatedForum = await GeneralForum.findById(forum._id).populate(
      "author",
      "username fullName displayNamePreference",
    );

    return res.status(201).json({
      success: true,
      message: "Class forum created successfully",
      data: {
        _id: populatedForum._id,
        title: populatedForum.title,
        description: populatedForum.description,
        tag: populatedForum.tag,
        privacy: populatedForum.privacy,
        attachments: populatedForum.attachments,
        createdAt: populatedForum.createdAt,
        upvoteCount: populatedForum.upvotes.length,
        replyCount: populatedForum.replies.length,
        author: {
          _id: populatedForum.author._id,
          username: populatedForum.author.username,
          fullName: populatedForum.author.fullName,
          nickname: populatedForum.author.nickname,
          displayName: formatDisplayName(populatedForum.author),
        },
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

export const getClassForumById = async (req, res) => {
  try {
    const { classId, forumId } = req.params;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    })
      .populate(
        "author",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate(
        "replies.author",
        "username fullName nickname avatar displayNamePreference",
      );

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const authorIds = [
      forum.author?._id,
      ...forum.replies.map((reply) => reply.author?._id),
    ].filter(Boolean);

    const achievementMap = await getShowcaseAchievementMap(authorIds);

    const formattedReplies = forum.replies.map((reply) => ({
      _id: reply._id,
      content: reply.content,
      attachments: reply.attachments,
      parentReplyId: reply.parentReplyId,
      createdAt: reply.createdAt,
      isDeleted: reply.isDeleted || false,
      deletedAt: reply.deletedAt || null,
      upvoteCount: reply.upvotes.length,
      hasUpvoted: reply.upvotes.some(
        (id) => id.toString() === req.user._id.toString(),
      ),
      author: reply.author
        ? {
            _id: reply.author._id,
            username: reply.author.username,
            fullName: reply.author.fullName,
            nickname: reply.author.nickname,
            avatar: reply.author.avatar || "",
            displayName: formatDisplayName(reply.author),
            showcaseAchievements:
              achievementMap.get(reply.author._id.toString())?.slice(0, 2) ||
              [],
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Class forum fetched successfully",
      data: {
        _id: forum._id,
        title: forum.title,
        description: forum.description,
        tag: forum.tag,
        privacy: forum.privacy,
        createdAt: forum.createdAt,
        upvoteCount: forum.upvotes.length,
        hasUpvoted: forum.upvotes.some(
          (id) => id.toString() === req.user._id.toString(),
        ),
        author: forum.author
          ? {
              _id: forum.author._id,
              username: forum.author.username,
              fullName: forum.author.fullName,
              nickname: forum.author.nickname,
              avatar: forum.author.avatar || "",
              displayName: formatDisplayName(forum.author),
              showcaseAchievements:
                achievementMap.get(forum.author._id.toString())?.slice(0, 2) ||
                [],
            }
          : null,
        attachments: forum.attachments,
        replies: formattedReplies,
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

export const replyToClassForum = async (req, res) => {
  try {
    const { classId, forumId } = req.params;
    const { content, parentReplyId = null, attachments = [] } = req.body;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    if (parentReplyId) {
      const parentExists = forum.replies.some(
        (reply) => reply._id.toString() === parentReplyId,
      );

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent reply not found",
        });
      }
    }

    forum.replies.push({
      author: req.user._id,
      content: content.trim(),
      attachments,
      parentReplyId,
      upvotes: [],
    });

    await forum.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.forumReplies": 1 },
    });

    await checkAchievements({
      userId: req.user._id,
      trigger: "reply_forum",
      classId,
    });

    const savedForum = await GeneralForum.findById(forumId).populate(
      "replies.author",
      "username fullName nickname displayNamePreference",
    );

    const createdReply = savedForum.replies[savedForum.replies.length - 1];

    return res.status(201).json({
      success: true,
      message: "Reply created successfully",
      data: {
        _id: createdReply._id,
        content: createdReply.content,
        attachments: createdReply.attachments,
        parentReplyId: createdReply.parentReplyId,
        createdAt: createdReply.createdAt,
        upvoteCount: createdReply.upvotes.length,
        author: {
          _id: createdReply.author._id,
          username: createdReply.author.username,
          fullName: createdReply.author.fullName,
          nickname: createdReply.author.nickname,
          displayName: formatDisplayName(createdReply.author),
        },
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

export const toggleClassForumUpvote = async (req, res) => {
  try {
    const { classId, forumId } = req.params;
    const userId = req.user._id.toString();

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const alreadyUpvoted = forum.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      forum.upvotes = forum.upvotes.filter((id) => id.toString() !== userId);
    } else {
      forum.upvotes.push(req.user._id);
    }

    await forum.save();

    if (
      !alreadyUpvoted &&
      forum.author.toString() !== req.user._id.toString()
    ) {
      await User.findByIdAndUpdate(forum.author, {
        $inc: { "stats.forumUpvotes": 1 },
      });

      await checkAchievements({
        userId: forum.author,
        trigger: "get_forum_upvote",
        classId,
      });
    }

    return res.status(200).json({
      success: true,
      message: alreadyUpvoted
        ? "Forum upvote removed"
        : "Forum upvoted successfully",
      data: {
        forumId: forum._id,
        upvoteCount: forum.upvotes.length,
        hasUpvoted: !alreadyUpvoted,
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

export const toggleClassForumReplyUpvote = async (req, res) => {
  try {
    const { classId, forumId, replyId } = req.params;
    const userId = req.user._id.toString();

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const reply = forum.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    const alreadyUpvoted = reply.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      reply.upvotes = reply.upvotes.filter((id) => id.toString() !== userId);
    } else {
      reply.upvotes.push(req.user._id);
    }

    await forum.save();

    if (
      !alreadyUpvoted &&
      reply.author.toString() !== req.user._id.toString()
    ) {
      await User.findByIdAndUpdate(reply.author, {
        $inc: { "stats.forumUpvotes": 1 },
      });

      await checkAchievements({
        userId: reply.author,
        trigger: "get_forum_upvote",
        classId,
      });
    }

    return res.status(200).json({
      success: true,
      message: alreadyUpvoted
        ? "Reply upvote removed"
        : "Reply upvoted successfully",
      data: {
        forumId: forum._id,
        replyId: reply._id,
        upvoteCount: reply.upvotes.length,
        hasUpvoted: !alreadyUpvoted,
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

export const editClassForum = async (req, res) => {
  try {
    const { classId, forumId } = req.params;
    const { title, description, tag, attachments } = req.body;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const isAuthor = forum.author.toString() === req.user._id.toString();

    if (!isAuthor) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own forum",
      });
    }

    if (title) forum.title = title.trim();
    if (description) forum.description = description.trim();
    if (tag) forum.tag = tag;
    if (attachments) forum.attachments = attachments;

    await forum.save();

    return res.status(200).json({
      success: true,
      message: "Forum updated successfully",
      data: forum,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteClassForum = async (req, res) => {
  try {
    const { classId, forumId } = req.params;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const isAuthor = forum.author.toString() === req.user._id.toString();

    if (!isAuthor) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own forum",
      });
    }

    await forum.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Forum deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const editClassForumReply = async (req, res) => {
  try {
    const { classId, forumId, replyId } = req.params;
    const { content, attachments = [] } = req.body;

    const access = await checkClassAccess(classId, req.user._id);

    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const reply = forum.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    const isAuthor = reply.author.toString() === req.user._id.toString();

    if (!isAuthor) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reply",
      });
    }

    if (content) reply.content = content.trim();
    reply.attachments = attachments;

    await forum.save();

    return res.status(200).json({
      success: true,
      message: "Reply updated successfully",
      data: reply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteClassForumReply = async (req, res) => {
  try {
    const { classId, forumId, replyId } = req.params;

    const access = await checkClassAccess(classId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error,
      });
    }

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "class",
      associatedClass: classId,
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Class forum not found",
      });
    }

    const reply = forum.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    const isAuthor = reply.author.toString() === req.user._id.toString();

    const isTeacher =
      access.foundClass.teacher.toString() === req.user._id.toString();

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this reply",
      });
    }

    reply.content = "[deleted]";
    reply.attachments = [];
    reply.isDeleted = true;
    reply.deletedAt = new Date();

    forum.markModified("replies");
    await forum.save();

    return res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REPLY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
