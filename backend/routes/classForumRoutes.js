import express from "express";
import {
  createClassForum,
  deleteClassForum,
  deleteClassForumReply,
  editClassForum,
  editClassForumReply,
  getClassForumById,
  getClassForums,
  replyToClassForum,
  toggleClassForumReplyUpvote,
  toggleClassForumUpvote,
  uploadClassForumImage,
} from "../controllers/classForumController.js";
import { protect } from "../middleware/authMiddleware.js";
import uploadForumImage from "../middleware/uploadClassForumImage.js";

const router = express.Router();

router.get("/:classId/forum", protect, getClassForums);
router.post("/:classId/forum", protect, createClassForum);
router.get("/:classId/forum/:forumId", protect, getClassForumById);
router.post("/:classId/forum/:forumId/reply", protect, replyToClassForum);
router.post("/:classId/forum/:forumId/upvote", protect, toggleClassForumUpvote);
router.post(
  "/:classId/forum/:forumId/replies/:replyId/upvote",
  protect,
  toggleClassForumReplyUpvote,
);
router.put("/:classId/forum/:forumId", protect, editClassForum);
router.delete("/:classId/forum/:forumId", protect, deleteClassForum);
router.put(
  "/:classId/forum/:forumId/replies/:replyId",
  protect,
  editClassForumReply,
);
router.delete(
  "/:classId/forum/:forumId/replies/:replyId",
  protect,
  deleteClassForumReply,
);
router.post(
  "/:classId/forum/upload-image",
  protect,
  uploadForumImage.single("image"),
  uploadClassForumImage,
);

export default router;
