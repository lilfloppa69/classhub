import express from "express";
import {
  becomeHybrid,
  getMyAccount,
  getMyProfileInformation,
  updateMyAccount,
  updateMyProfileInformation,
  uploadAvatar as uploadAvatarController,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uploadAvatar.js";
import {
  deleteAvatar,
  getMyShowcase,
  toggleDisplayAchievement,
} from "../controllers/userController.js";
import { toggleShowcaseAchievement } from "../controllers/achievementController.js";

const router = express.Router();

router.get("/information", protect, getMyProfileInformation);
router.patch("/information", protect, updateMyProfileInformation);
router.post(
  "/information/avatar",
  protect,
  uploadAvatar.single("avatar"),
  uploadAvatarController,
);
router.delete("/information/avatar", protect, deleteAvatar);
router.get("/showcase", protect, getMyShowcase);
router.patch(
  "/showcase/display-achievement",
  protect,
  toggleDisplayAchievement,
);
router.patch("/account", protect, updateMyAccount);
router.get("/account", protect, getMyAccount);
// router.patch("/account/become-hybrid", protect, becomeHybrid);
router.patch("/showcase/:achievementId", protect, toggleShowcaseAchievement);

export default router;
