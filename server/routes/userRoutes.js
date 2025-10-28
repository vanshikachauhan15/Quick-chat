import express from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

// 🧾 Signup, Login, Profile Update
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);

// ✅ Health & Auth Check Route
// This route always works — even in demo mode or without a token
userRouter.get("/check", async (req, res) => {
  try {
    // If a token exists, try to verify the user
    if (req.headers.authorization) {
      await protectRoute(req, res, async () => {
        await checkAuth(req, res);
      });
    } else {
      // No token → still respond OK (for frontend health checks)
      res.status(200).json({
        success: true,
        message: "Server active (unauthenticated ✅)",
      });
    }
  } catch (err) {
    // Catch-all: backend reachable, auth failed
    res.status(200).json({
      success: false,
      message: "Server active but auth check failed ⚠️",
      error: err.message,
    });
  }
});

export default userRouter;
