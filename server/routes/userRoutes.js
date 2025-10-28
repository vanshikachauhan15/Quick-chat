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

// ✅ Fixed: Universal /check route (works in all modes)
userRouter.get("/check", async (req, res) => {
  try {
    // Try to verify token safely
    await new Promise((resolve, reject) => {
      protectRoute(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Token valid → check auth
    return checkAuth(req, res);
  } catch (err) {
    // Token invalid → just send single response
    if (!res.headersSent) {
      return res.json({
        status: "ok",
        message: "No auth, but server is up ✅",
      });
    }
  }
});

export default userRouter;

