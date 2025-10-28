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
// Always works — even in demo mode or without a token
userRouter.get("/check", async (req, res) => {
  try {
    // If authorization header is present, verify token
    if (req.headers.authorization) {
      // Wrap protectRoute properly so Express flow doesn’t break
      await new Promise((resolve) => {
        protectRoute(req, res, async () => {
          await checkAuth(req, res);
          resolve();
        });
      });
    } else {
      // No token — just confirm backend is live
      res.status(200).json({
        success: true,
        message: "Server active (unauthenticated ✅)",
      });
    }
  } catch (err) {
    // Catch any token errors but still confirm server is up
    res.status(200).json({
      success: false,
      message: "Server active but auth check failed ⚠️",
      error: err.message || err,
    });
  }
});

export default userRouter;


export default userRouter;
