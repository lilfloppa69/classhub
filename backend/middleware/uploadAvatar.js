import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/avatars";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg", // 🔥 tambahin ini
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.includes(ext);

  if (isMimeValid || isExtValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export default uploadAvatar;
