import crypto from "crypto";
import GeneralForum from "../models/GeneralForum.js";
import Class from "../models/Class.js";
import getDisplayName from "../utils/getDisplayName.js";
import bcrypt from "bcryptjs";
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

export const uploadGeneralForumImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
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
        message: "Uploaded image URL not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Forum image uploaded successfully",
      data: {
        url: fileUrl,
        name: file.originalname || file.filename || "forum-image",
        fileType: "image",
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

export const getGeneralForums = async (req, res) => {
  try {
    const { search = "", tag, category = "all", sort = "recent" } = req.query;

    const query = {};

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
      .populate("associatedClass", "title subject teacher students")
      .sort({ createdAt: -1 });

    forums = forums.filter((forum) => {
      const isAuthor =
        (forum.author?._id
          ? forum.author._id.toString()
          : forum.author?.toString()) === req.user._id.toString();

      const hasJoined = (forum.joinedUsers || []).some(
        (joinedUserId) => joinedUserId.toString() === req.user._id.toString(),
      );

      // Invite forum hidden dari list umum, kecuali author atau user yang sudah join
      if (forum.privacy === "invite") {
        return isAuthor || hasJoined;
      }

      if (forum.associationType === "general") return true;

      if (forum.associationType === "class" && forum.associatedClass) {
        const isTeacher =
          forum.associatedClass.teacher?.toString() === req.user._id.toString();

        const isStudent = forum.associatedClass.students?.some(
          (studentId) => studentId.toString() === req.user._id.toString(),
        );

        return isTeacher || isStudent;
      }

      return false;
    });

    if (category === "classes") {
      forums = forums.filter((forum) => forum.associationType === "class");
    } else if (category === "general") {
      forums = forums.filter((forum) => forum.associationType === "general");
    } else if (category === "private") {
      forums = forums.filter((forum) => forum.privacy === "password");
    } else if (category === "invite") {
      forums = forums.filter((forum) => forum.privacy === "invite");
    }
    let data = forums.map((forum) => ({
      _id: forum._id,
      title: forum.title,
      description: forum.description,
      tag: forum.tag,
      associationType: forum.associationType,
      associatedClass: forum.associatedClass
        ? {
            _id: forum.associatedClass._id,
            title: forum.associatedClass.title,
            subject: forum.associatedClass.subject,
          }
        : null,
      privacy: forum.privacy,
      isLocked: forum.privacy === "password",
      createdAt: forum.createdAt,
      author: forum.author
        ? {
            _id: forum.author._id,
            username: forum.author.username,
            fullName: forum.author.fullName,
            avatar: forum.author.avatar || "",
            displayName: formatDisplayName(forum.author),
          }
        : null,
      upvoteCount: forum.upvotes.length,
      replyCount: forum.replies.length,
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
      message: "Forums fetched successfully",
      data,
    });
  } catch (error) {
    console.error("getGeneralForums error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getGeneralForumById = async (req, res) => {
  try {
    const { forumId } = req.params;

    const forum = await GeneralForum.findById(forumId)
      .populate(
        "author",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate("associatedClass", "title subject teacher students")
      .populate(
        "replies.author",
        "username fullName nickname avatar displayNamePreference",
      );
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
      });
    }

    if (!canAccessForum(forum, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this forum",
      });
    }

    if (forum.associationType === "class" && forum.associatedClass) {
      const isTeacher =
        forum.associatedClass.teacher?.toString() === req.user._id.toString();

      const isStudent = forum.associatedClass.students?.some(
        (studentId) => studentId.toString() === req.user._id.toString(),
      );

      if (!isTeacher && !isStudent) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this class-linked forum",
        });
      }
    }

    const isAuthor =
      (forum.author?._id
        ? forum.author._id.toString()
        : forum.author?.toString()) === req.user._id.toString();

    const formattedReplies = forum.replies.map((reply) => ({
      _id: reply._id,
      content: reply.content,
      attachments: reply.attachments,
      parentReplyId: reply.parentReplyId,
      createdAt: reply.createdAt,
      upvoteCount: reply.upvotes.length,
      author: reply.author
        ? {
            _id: reply.author._id,
            username: reply.author.username,
            fullName: reply.author.fullName,
            nickname: reply.author.nickname,
            avatar: reply.author.avatar || "",
            displayName: formatDisplayName(reply.author),
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Forum fetched successfully",
      data: {
        _id: forum._id,
        title: forum.title,
        description: forum.description,
        tag: forum.tag,
        associationType: forum.associationType,
        associatedClass: forum.associatedClass
          ? {
              _id: forum.associatedClass._id,
              title: forum.associatedClass.title,
              subject: forum.associatedClass.subject,
            }
          : null,
        privacy: forum.privacy,
        isLocked: forum.privacy === "password",
        password: isAuthor ? forum.password : "",
        inviteLink: isAuthor ? forum.inviteLink : "",
        inviteExpiresAt: isAuthor ? forum.inviteExpiresAt : null,
        createdAt: forum.createdAt,
        upvoteCount: forum.upvotes.length,
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

export const createGeneralForum = async (req, res) => {
  try {
    const {
      title,
      description,
      tag,
      associationType = "general",
      associatedClass,
      privacy = "public",
      password,
      attachments = [],
    } = req.body;

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

    if (!["general", "class"].includes(associationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid association type",
      });
    }

    if (!["public", "password", "invite"].includes(privacy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid privacy type",
      });
    }

    let finalAssociatedClass = null;

    if (associationType === "class") {
      if (!associatedClass) {
        return res.status(400).json({
          success: false,
          message: "Associated class is required for class forum",
        });
      }

      const foundClass = await Class.findById(associatedClass);

      if (!foundClass) {
        return res.status(404).json({
          success: false,
          message: "Associated class not found",
        });
      }

      const isTeacher =
        foundClass.teacher.toString() === req.user._id.toString();

      const isStudent = foundClass.students.some(
        (studentId) => studentId.toString() === req.user._id.toString(),
      );

      if (!isTeacher && !isStudent) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to create a forum for this class",
        });
      }

      finalAssociatedClass = associatedClass;
    }

    let finalPassword = "";
    let finalInviteLink = "";

    if (privacy === "password") {
      if (!password || !password.trim()) {
        return res.status(400).json({
          success: false,
          message: "Password is required for password-protected forum",
        });
      }

      const salt = await bcrypt.genSalt(10);
      finalPassword = await bcrypt.hash(password.trim(), salt);
    }

    if (privacy === "invite") {
      const inviteCode = crypto.randomBytes(12).toString("hex");
      finalInviteLink = `forum-invite-${inviteCode}`;
    }

    const forum = await GeneralForum.create({
      title: title.trim(),
      description: description.trim(),
      tag,
      associationType,
      associatedClass: finalAssociatedClass,
      privacy,
      password: finalPassword,
      inviteLink: finalInviteLink,
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
      classId: finalAssociatedClass || null,
    });

    const populatedForum = await GeneralForum.findById(forum._id)
      .populate(
        "replies.author",
        "username fullName nickname avatar displayNamePreference",
      )
      .populate("associatedClass", "title subject");

    return res.status(201).json({
      success: true,
      message: "Forum created successfully",
      data: {
        _id: populatedForum._id,
        title: populatedForum.title,
        description: populatedForum.description,
        tag: populatedForum.tag,
        associationType: populatedForum.associationType,
        associatedClass: populatedForum.associatedClass,
        privacy: populatedForum.privacy,
        inviteLink: populatedForum.inviteLink,
        attachments: populatedForum.attachments,
        createdAt: populatedForum.createdAt,
        upvoteCount: populatedForum.upvotes.length,
        replyCount: populatedForum.replies.length,
        author: {
          _id: populatedForum.author._id,
          username: populatedForum.author.username,
          fullName: populatedForum.author.fullName,
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

export const replyToGeneralForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { content, parentReplyId = null, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const forum = await GeneralForum.findById(forumId);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
      });
    }

    if (!canAccessForum(forum, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this forum",
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
      classId: forum.associatedClass || null,
    });

    const savedForum = await GeneralForum.findById(forumId).populate(
      "replies.author",
      "username fullName displayNamePreference",
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

export const toggleGeneralForumUpvote = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user._id.toString();

    const forum = await GeneralForum.findById(forumId);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
      });
    }

    const alreadyUpvoted = forum.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      forum.upvotes = forum.upvotes.filter((id) => id.toString() !== userId);
    } else {
      forum.upvotes.push(req.user._id);
    }

    if (!canAccessForum(forum, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this forum",
      });
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
        classId: forum.associatedClass || null,
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

export const toggleGeneralForumReplyUpvote = async (req, res) => {
  try {
    const { forumId, replyId } = req.params;
    const userId = req.user._id.toString();

    const forum = await GeneralForum.findById(forumId);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
      });
    }

    if (!canAccessForum(forum, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this forum",
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
        classId: forum.associatedClass || null,
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

export const joinGeneralForumByPassword = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { password } = req.body || {};

    const forum = await GeneralForum.findById(forumId);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum tidak ditemukan",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password forum wajib diisi",
      });
    }

    if (forum.privacy !== "password") {
      return res.status(400).json({
        success: false,
        message: "Forum ini bukan forum password",
      });
    }

    const isMatch = await bcrypt.compare(password.trim(), forum.password || "");

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password forum salah",
      });
    }

    if (forum.author.toString() === req.user._id.toString()) {
      return res.status(200).json({
        success: true,
        message: "Author already has access to this forum",
        data: {
          _id: forum._id,
          title: forum.title,
          privacy: forum.privacy,
          associationType: forum.associationType,
        },
      });
    }

    const alreadyJoined = forum.joinedUsers.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (!alreadyJoined) {
      forum.joinedUsers.push(req.user._id);
      await forum.save();
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil join forum",
      data: {
        _id: forum._id,
        title: forum.title,
        privacy: forum.privacy,
        associationType: forum.associationType,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal join forum dengan password",
      error: error.message,
    });
  }
};

export const joinGeneralForumByInvite = async (req, res) => {
  try {
    const { inviteToken } = req.body;

    const forum = await GeneralForum.findOne({ inviteLink: inviteToken });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Invite forum tidak valid",
      });
    }

    if (forum.privacy !== "invite") {
      return res.status(400).json({
        success: false,
        message: "Forum ini bukan forum invite",
      });
    }

    if (forum.inviteExpiresAt && new Date() > forum.inviteExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invite forum sudah expired",
      });
    }

    if (forum.author.toString() === req.user._id.toString()) {
      return res.status(200).json({
        success: true,
        message: "Author already has access to this forum",
        data: {
          _id: forum._id,
          title: forum.title,
          privacy: forum.privacy,
          associationType: forum.associationType,
          associatedClass: forum.associatedClass || null,
        },
      });
    }

    const alreadyJoined = forum.joinedUsers.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (!alreadyJoined) {
      forum.joinedUsers.push(req.user._id);
      await forum.save();
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil join forum via invite",
      data: {
        _id: forum._id,
        title: forum.title,
        privacy: forum.privacy,
        associationType: forum.associationType,
        associatedClass: forum.associatedClass || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal join forum via invite",
      error: error.message,
    });
  }
};

export const canAccessForum = (forum, userId) => {
  if (forum.privacy === "public") return true;

  const authorId = forum.author?._id
    ? forum.author._id.toString()
    : forum.author?.toString();

  if (authorId === userId.toString()) return true;

  return (forum.joinedUsers || []).some(
    (joinedUserId) => joinedUserId.toString() === userId.toString(),
  );
};

export const editGeneralForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { title, description, tag, attachments } = req.body;

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "general",
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "General forum not found",
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

export const deleteGeneralForum = async (req, res) => {
  try {
    const { forumId } = req.params;

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "general",
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "General forum not found",
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

export const editGeneralForumReply = async (req, res) => {
  try {
    const { forumId, replyId } = req.params;
    const { content, attachments = [] } = req.body;

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "general",
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
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

export const deleteGeneralForumReply = async (req, res) => {
  try {
    const { forumId, replyId } = req.params;

    const forum = await GeneralForum.findOne({
      _id: forumId,
      associationType: "general",
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: "Forum not found",
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

    const isForumOwner = forum.author.toString() === req.user._id.toString();

    if (!isAuthor && !isForumOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this reply",
      });
    }

    reply.deleteOne();

    await forum.save();

    return res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
