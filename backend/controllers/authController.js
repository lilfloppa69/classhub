import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateSpecialization } from "../utils/specializations.js";

export const registerUser = async (req, res) => {
    try {
        const { username, fullName, email, password, phoneCountryCode, phoneNumber } = req.body;

        // validasi
        if (!username || !fullName || !email || !password || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // email has been registered or not?
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is not available",
            });
        }

        // available username?
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
        return res.status(400).json({
            success: false,
            message: "Username is not available",
        });
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // simpan user baru
        const user = await User.create({
        username,
        fullName,
        email,
        password: hashedPassword,
        phoneCountryCode,
        phoneNumber,
        });

        return res.status(201).json({
        success: true,
        message: "User has been registered",
        data: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phoneCountryCode: user.phoneCountryCode,
            phoneNumber: user.phoneNumber,
            role: user.role,
        },
        });
    } catch (error) {
        return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        });

    }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email or password are incorrect",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Email or password are incorrect",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login succesful",
      token,
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Succesfully fetch profile data",
      data: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

export const registerHybrid = async (req, res) => {
  try {

    const {
      username,
      fullName,
      email,
      password,
      phoneCountryCode,
      phoneNumber,
      gender,
      specialization,
      bio
    } = req.body;

    if (
      !username ||
      !fullName ||
      !email ||
      !password ||
      !phoneNumber ||
      !specialization
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (!validateSpecialization(specialization)) {
      return res.status(400).json({
        success: false,
        message: "Invalid specialization",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is not available",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username is not available",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneCountryCode,
      phoneNumber,
      gender,
      role: "hybrid",
      specialization,
      bio: bio || ""
    });

    return res.status(201).json({
      success: true,
      message: "Hybrid user has been registered",
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        bio: user.bio
      }
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
};