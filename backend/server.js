// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import morgan from "morgan";   // ✅ ADD THIS

// const app = express();

// // --- Middleware ---
// app.use(cors());
// app.use(express.json());      // Parse JSON body
// app.use(morgan("dev"));       // ✅ LOG EVERY REQUEST

// // --- MongoDB Connection ---
// const mongoUri =
//   `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}` +
//   `@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}` +
//   `/${process.env.MONGO_DB}?authSource=admin`;

// mongoose
//   .connect(mongoUri)
//   .then(() => console.log("✅ Mongo Connected"))
//   .catch((err) => console.error("❌ DB Connection Error:", err));

// // --- Schema & Model ---
// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
// });

// const User = mongoose.model("User", UserSchema);

// // --- Routes ---

// // ✅ Health check (FOR CURL / MONITORING)
// app.get("/health", (req, res) => {
//   res.status(200).send("OK");
// });

// // Root route
// app.get("/", (req, res) => {
//   res.json({ status: "Backend Running 👍" });
// });

// // Create user
// app.post("/api/users", async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name || !name.trim()) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Name is required" });
//     }

//     const user = new User({ name });
//     await user.save();

//     res.json({ success: true, user });
//   } catch (err) {
//     console.error("❌ Error saving user:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // Get all users
// app.get("/api/users", async (req, res) => {
//   try {
//     const users = await User.find().sort({ _id: -1 });
//     res.json(users);
//   } catch (err) {
//     console.error("❌ Error fetching users:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // --- Start Server ---
// const PORT = process.env.NODE_PORT || 5003;

// app.listen(PORT, () =>
//   console.log(`🚀 Server running on port ${PORT}`)
// );










import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Middleware
app.use(cors({
  origin: "https://try-node-git-main-abhishek-sahanes-projects.vercel.app",
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running 🚀" });
});

// --------------------
// MongoDB Connection
// --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// --------------------
// User Schema & Model
// --------------------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// --------------------
// Routes
// --------------------

// Save user
app.post("/users", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const user = await User.create({ name });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save user" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
