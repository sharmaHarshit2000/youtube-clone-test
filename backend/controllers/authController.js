import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadUserProfileToCloudinary } from "../config/cloudinary.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const profile = req.file; // profile image

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let uploadedProfileImage;
    if (profile) {
      uploadedProfileImage = await uploadUserProfileToCloudinary(
        profile.buffer
      );
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePic: uploadedProfileImage?.secure_url || "",
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("channels"); // ✅ changed

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        channels: user.channels, // ✅ added
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get logged-in user details
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("channels");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
