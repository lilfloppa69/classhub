import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import generalForumRoutes from "./routes/generalForumRoutes.js";
import classForumRoutes from "./routes/classForumRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import { seedAchievements } from "./scripts/seedAchievements.js";

dotenv.config();

const app = express();

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://classhub-frontend-production.up.railway.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/classes", classForumRoutes);
app.use("/api/forum", generalForumRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/my-profile", userRoutes);
app.use("/api/calendar", calendarRoutes);
app.use(
  "/uploads",
  express.static(path.resolve("uploads"), {
    setHeaders: (res, filePath) => {
      const fileName = path.basename(filePath).replace(/"/g, "");
      const ext = path.extname(filePath).toLowerCase();

      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      }

      if ([".jpg", ".jpeg"].includes(ext)) {
        res.setHeader("Content-Type", "image/jpeg");
      }

      if (ext === ".png") {
        res.setHeader("Content-Type", "image/png");
      }

      if (ext === ".gif") {
        res.setHeader("Content-Type", "image/gif");
      }

      if (ext === ".webp") {
        res.setHeader("Content-Type", "image/webp");
      }
    },
  }),
);

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAchievements();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
