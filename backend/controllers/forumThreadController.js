import ForumThread from "../models/ForumThread.js";
import GeneralForum from "../models/GeneralForum.js";
import Class from "../models/Class.js";

export const getForumThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await ForumThread.findById(threadId)
      .populate("author", "username fullName displayNamePreference")
      .populate("generalForumId", "title privacy associationType associatedClass")
      .populate("classId", "title subject")
      .populate("replies.author", "username fullName displayNamePreference");

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Forum thread not found",
      });
    }

    const formatDisplayName = (user) =>
      user?.displayNamePreference === "fullName"
        ? user.fullName
        : user.username;

    const formattedReplies = thread.replies.map((reply) => ({
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
            displayName: formatDisplayName(reply.author),
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Forum thread fetched successfully",
      data: {
        _id: thread._id,
        forumType: thread.forumType,
        title: thread.title,
        content: thread.content,
        tag: thread.tag,
        attachments: thread.attachments,
        createdAt: thread.createdAt,
        upvoteCount: thread.upvotes.length,
        author: thread.author
          ? {
              _id: thread.author._id,
              username: thread.author.username,
              fullName: thread.author.fullName,
              displayName: formatDisplayName(thread.author),
            }
          : null,
        generalForum: thread.generalForumId || null,
        class: thread.classId || null,
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

export const replyToForumThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parentReplyId = null, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const thread = await ForumThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Forum thread not found",
      });
    }

    if (parentReplyId) {
      const parentExists = thread.replies.some(
        (reply) => reply._id.toString() === parentReplyId
      );

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent reply not found",
        });
      }
    }

    const newReply = {
      author: req.user._id,
      content: content.trim(),
      attachments,
      parentReplyId,
      upvotes: [],
    };

    thread.replies.push(newReply);
    await thread.save();

    const savedThread = await ForumThread.findById(threadId).populate(
      "replies.author",
      "username fullName displayNamePreference"
    );

    const createdReply = savedThread.replies[savedThread.replies.length - 1];

    const displayName =
      createdReply.author?.displayNamePreference === "fullName"
        ? createdReply.author.fullName
        : createdReply.author.username;

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
        author: createdReply.author
          ? {
              _id: createdReply.author._id,
              username: createdReply.author.username,
              fullName: createdReply.author.fullName,
              displayName,
            }
          : null,
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

export const toggleThreadUpvote = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id.toString();

    const thread = await ForumThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Forum thread not found",
      });
    }

    const alreadyUpvoted = thread.upvotes.some(
      (id) => id.toString() === userId
    );

    if (alreadyUpvoted) {
      thread.upvotes = thread.upvotes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      thread.upvotes.push(req.user._id);
    }

    await thread.save();

    return res.status(200).json({
      success: true,
      message: alreadyUpvoted
        ? "Thread upvote removed"
        : "Thread upvoted successfully",
      data: {
        threadId: thread._id,
        upvoteCount: thread.upvotes.length,
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

export const toggleReplyUpvote = async (req, res) => {
  try {
    const { threadId, replyId } = req.params;
    const userId = req.user._id.toString();

    const thread = await ForumThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Forum thread not found",
      });
    }

    const reply = thread.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    const alreadyUpvoted = reply.upvotes.some(
      (id) => id.toString() === userId
    );

    if (alreadyUpvoted) {
      reply.upvotes = reply.upvotes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      reply.upvotes.push(req.user._id);
    }

    await thread.save();

    return res.status(200).json({
      success: true,
      message: alreadyUpvoted
        ? "Reply upvote removed"
        : "Reply upvoted successfully",
      data: {
        threadId: thread._id,
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

export const createForumThread = async (req, res) => {
  try {
    const {
      forumType,
      generalForumId = null,
      classId = null,
      title,
      content,
      tag = "question",
      attachments = [],
    } = req.body;

    if (!forumType || !["general", "class"].includes(forumType)) {
      return res.status(400).json({
        success: false,
        message: "Valid forumType is required",
      });
    }

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    if (!["announcement", "resource", "question"].includes(tag)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tag",
      });
    }

    let finalGeneralForumId = null;
    let finalClassId = null;

    if (forumType === "general") {
      if (!generalForumId) {
        return res.status(400).json({
          success: false,
          message: "generalForumId is required for general forum thread",
        });
      }

      const forum = await GeneralForum.findById(generalForumId).populate(
        "associatedClass",
        "teacher students"
      );

      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "General forum not found",
        });
      }

      if (forum.privacy === "invite") {
        return res.status(403).json({
          success: false,
          message: "Invite forum requires invite access logic first",
        });
      }

      if (forum.associationType === "class" && forum.associatedClass) {
        const isTeacher =
          forum.associatedClass.teacher?.toString() === req.user._id.toString();

        const isStudent = forum.associatedClass.students?.some(
          (studentId) => studentId.toString() === req.user._id.toString()
        );

        if (!isTeacher && !isStudent) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this class-linked forum",
          });
        }
      }

      finalGeneralForumId = generalForumId;
    }

    if (forumType === "class") {
      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "classId is required for class forum thread",
        });
      }

      const foundClass = await Class.findById(classId);

      if (!foundClass) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      const isTeacher =
        foundClass.teacher.toString() === req.user._id.toString();

      const isStudent = foundClass.students.some(
        (studentId) => studentId.toString() === req.user._id.toString()
      );

      if (!isTeacher && !isStudent) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this class forum",
        });
      }

      finalClassId = classId;
    }

    const thread = await ForumThread.create({
      forumType,
      generalForumId: finalGeneralForumId,
      classId: finalClassId,
      title: title.trim(),
      content: content.trim(),
      tag,
      author: req.user._id,
      attachments,
      upvotes: [],
      replies: [],
    });

    const populatedThread = await ForumThread.findById(thread._id)
      .populate("author", "username fullName displayNamePreference")
      .populate("generalForumId", "title privacy associationType associatedClass")
      .populate("classId", "title subject");

    const displayName =
      populatedThread.author?.displayNamePreference === "fullName"
        ? populatedThread.author.fullName
        : populatedThread.author.username;

    return res.status(201).json({
      success: true,
      message: "Forum thread created successfully",
      data: {
        _id: populatedThread._id,
        forumType: populatedThread.forumType,
        title: populatedThread.title,
        content: populatedThread.content,
        tag: populatedThread.tag,
        attachments: populatedThread.attachments,
        createdAt: populatedThread.createdAt,
        upvoteCount: populatedThread.upvotes.length,
        author: populatedThread.author
          ? {
              _id: populatedThread.author._id,
              username: populatedThread.author.username,
              fullName: populatedThread.author.fullName,
              displayName,
            }
          : null,
        generalForum: populatedThread.generalForumId || null,
        class: populatedThread.classId || null,
        replies: [],
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