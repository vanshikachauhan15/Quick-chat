import express from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);

// 🧠 FIXED: In demo mode, /check route should work without token
if (process.env.DEMO_MODE === "true") {
  userRouter.get("/check", checkAuth);
} else {
  userRouter.get("/check", protectRoute, checkAuth);
}

export default userRouter;
