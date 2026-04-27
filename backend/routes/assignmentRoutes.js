import express from "express";
import {
  cancelSubmission,
  evaluateAllSubmissions,
  evaluateSubmission,
  getAssignmentById,
  getAssignmentStudents,
  // getClassAssignments,
  getMySubmissionStatus,
  getMyTasks,
  getSubmissionForEvaluation,
  submitAssignment,
  uploadSubmissionFile,
  createAssignmentComment,
  deleteAssignmentComment,
  cancelReturnedSubmission,
} from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import uploadAssignmentFile from "../middleware/uploadAssignmentFIle.js";

const router = express.Router();

router.get("/my-tasks", protect, getMyTasks);
// router.get("/class/:classId", protect, getClassAssignments)
router.get("/:assignmentId", protect, getAssignmentById);
router.post("/:assignmentId/comments", protect, createAssignmentComment);
router.delete(
  "/:assignmentId/comments/:commentId",
  protect,
  deleteAssignmentComment,
);
router.post("/:assignmentId/submit", protect, submitAssignment);
router.post(
  "/:assignmentId/upload-submission-file",
  protect,
  uploadAssignmentFile.single("file"),
  uploadSubmissionFile,
);
router.get("/:assignmentId/submission-status", protect, getMySubmissionStatus);
router.get("/:assignmentId/students", protect, getAssignmentStudents);
router.get(
  "/:assignmentId/submission/:studentId",
  protect,
  getSubmissionForEvaluation,
);
router.post("/:assignmentId/evaluate/:studentId", protect, evaluateSubmission);
router.post("/:assignmentId/evaluate-all", protect, evaluateAllSubmissions);
router.patch("/:assignmentId/cancel-submission", protect, cancelSubmission);
router.patch(
  "/:assignmentId/evaluate/:studentId/cancel",
  protect,
  cancelReturnedSubmission,
);

export default router;
