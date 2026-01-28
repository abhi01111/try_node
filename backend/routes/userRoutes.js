import express from "express";
import User from "../models/User.js";

const router = express.Router();

// CREATE user
router.post("/", async (req, res) => {
  try {
    const user = await User.create({ name: req.body.name });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET users
router.get("/", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

export default router;
