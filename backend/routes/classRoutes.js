import express from "express";
import {
  getClassById,
  getClassStudents,
  getMyClasses,
  joinClass,
  getClassLeaderboard,
  leaveClass,
  createClass,
  getClassAssignments,
} from "../controllers/classController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createAssignment,
  getClassGradebook,
} from "../controllers/assignmentController.js";
import {
  createClassAchievement,
  getClassAchievements,
  giveClassAchievementEarly,
} from "../controllers/achievementController.js";
import uploadAssignmentFile from "../middleware/uploadAssignmentFIle.js";
import { uploadAssignmentFile as uploadAssignmentFileController } from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/my-classes", protect, getMyClasses);
router.get("/:classId", protect, getClassById);
router.get("/:classId/assignments", protect, getClassAssignments);
router.get("/:classId/students", protect, getClassStudents);
router.get("/:classId/leaderboard", protect, getClassLeaderboard);
router.post(
  "/:classId/assignments/upload-file",
  protect,
  uploadAssignmentFile.single("file"),
  uploadAssignmentFileController,
);
router.post("/:classId/assignments", protect, createAssignment);
router.post("/:classId/leave", protect, leaveClass);
router.post("/join", protect, joinClass);
router.post("/", protect, createClass);
router.post("/:classId/achievements", protect, createClassAchievement);
router.post(
  "/:classId/achievements/:achievementId/give-early",
  protect,
  giveClassAchievementEarly,
);
router.get("/:classId/achievements", protect, getClassAchievements);
router.get("/:classId/grades", protect, getClassGradebook);

export default router;
