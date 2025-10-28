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

// ✅ Universal /check route (works in all modes)
userRouter.get("/check", async (req, res) => {
  try {
    // Try to verify token (optional)
    await protectRoute(req, res, () => {});
    await checkAuth(req, res);
  } catch (err) {
    // No token or invalid -> send safe fallback
    res.json({ status: "ok", message: "No auth, but server is up ✅" });
  }
});

export default userRouter;

export default userRouter;
