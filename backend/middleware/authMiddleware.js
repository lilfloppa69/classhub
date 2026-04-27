import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // get the fookin token from header: Authorization Token
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;

      if (authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
      } else {
        token = authHeader; // langsung token tanpa Bearer
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, access denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
      error: error.message,
    });
  }
};
