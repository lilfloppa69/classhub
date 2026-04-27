import express, { Router } from "express";
import {
  createGeneralForum,
  deleteGeneralForum,
  deleteGeneralForumReply,
  editGeneralForum,
  editGeneralForumReply,
  getGeneralForumById,
  getGeneralForums,
  joinGeneralForumByInvite,
  joinGeneralForumByPassword,
  replyToGeneralForum,
  toggleGeneralForumReplyUpvote,
  toggleGeneralForumUpvote,
  uploadGeneralForumImage,
} from "../controllers/generalForumController.js";
import { protect } from "../middleware/authMiddleware.js";
import uploadAssignmentFile from "../middleware/uploadAssignmentFIle.js";

const router = express.Router();

router.get("/", protect, getGeneralForums);
router.post("/", protect, createGeneralForum);
router.get("/:forumId", protect, getGeneralForumById);
router.post("/:forumId/reply", protect, replyToGeneralForum);
router.post("/:forumId/upvote", protect, toggleGeneralForumUpvote);
router.post(
  "/:forumId/replies/:replyId/upvote",
  protect,
  toggleGeneralForumReplyUpvote,
);
router.post("/:forumId/join-password", protect, joinGeneralForumByPassword);
router.post("/join-invite", protect, joinGeneralForumByInvite);
router.put("/:forumId", protect, editGeneralForum);
router.delete("/:forumId", protect, deleteGeneralForum);
router.put("/:forumId/replies/:replyId", protect, editGeneralForumReply);
router.delete("/:forumId/replies/:replyId", protect, deleteGeneralForumReply);
router.post(
  "/upload-image",
  protect,
  uploadAssignmentFile.single("file"),
  uploadGeneralForumImage,
);
export default router;
