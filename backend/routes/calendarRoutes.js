import express from "express";
import { getCalendarOverview } from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getCalendarOverview);

export default router;
