import Class from "../models/Class.js";
import ForumPost from "../models/ForumPost.js";

export const getClassForumPosts = async (req, res) => {
  try {
    const { classId } = req.params;
    const { tag, sort = "recent", search = "" } = req.query;

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

    const query = { classId };

    if (tag && ["announcement", "resource", "question"].includes(tag)) {
      query.tag = tag;
    }

    if (search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    let posts = await ForumPost.find(query)
      .populate("author", "username fullName displayNamePreference")
      .sort({ createdAt: -1 });

    const formatDisplayName = (user) =>
      user.displayNamePreference === "fullName" ? user.fullName : user.username;

    posts = posts.map((post) => ({
      _id: post._id,
      title: post.title,
      content: post.content,
      tag: post.tag,
      createdAt: post.createdAt,
      author: {
        _id: post.author._id,
        username: post.author.username,
        fullName: post.author.fullName,
        displayName: formatDisplayName(post.author),
      },
      replyCount: post.replies.length,
    }));

    if (sort === "mostReplies") {
      posts.sort((a, b) => b.replyCount - a.replyCount);
    } else if (sort === "leastReplies") {
      posts.sort((a, b) => a.replyCount - b.replyCount);
    } else if (sort === "unanswered") {
      posts = posts
        .filter((post) => post.replyCount === 0)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      message: "Forum posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const createForumPost = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, content, tag } = req.body;

    if (!title || !content || !tag) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and tag are required",
      });
    }

    if (!["announcement", "resource", "question"].includes(tag)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tag",
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

    const post = await ForumPost.create({
      classId,
      author: req.user._id,
      title,
      content,
      tag,
    });

    const populatedPost = await ForumPost.findById(post._id).populate(
      "author",
      "username fullName displayNamePreference"
    );

    const displayName =
      populatedPost.author.displayNamePreference === "fullName"
        ? populatedPost.author.fullName
        : populatedPost.author.username;

    return res.status(201).json({
      success: true,
      message: "Forum post created successfully",
      data: {
        _id: populatedPost._id,
        title: populatedPost.title,
        content: populatedPost.content,
        tag: populatedPost.tag,
        createdAt: populatedPost.createdAt,
        author: {
          _id: populatedPost.author._id,
          username: populatedPost.author.username,
          fullName: populatedPost.author.fullName,
          displayName,
        },
        replyCount: populatedPost.replies.length,
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