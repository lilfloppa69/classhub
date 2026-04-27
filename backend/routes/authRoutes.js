import express from "express";
import {
  getMe,
  loginUser,
  registerHybrid,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// register route
router.post("/register", registerUser);
router.post("/register-hybrid", registerHybrid);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;
