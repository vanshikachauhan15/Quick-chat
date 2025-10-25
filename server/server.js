import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// ==============================
// FILE PATHS (ES Module fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, "../client/dist");

// ==============================
// CREATE EXPRESS APP AND HTTP SERVER
// ==============================
const app = express();
const server = http.createServer(app);

// ==============================
// INITIALIZE SOCKET.IO SERVER
// ==============================
export const io = new Server(server, { cors: { origin: "*" } });

// STORE ONLINE USERS
export const userSocketMap = {}; // {userId: socketId}

// SOCKET.IO CONNECTION HANDLER
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ==============================
// MIDDLEWARE
// ==============================
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ==============================
// ROUTES
// ==============================
app.use("/api/status", (req, res) => {
  res.send("Server is live (demo mode if DB not connected)");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ==============================
// SAFE DEPLOYMENT ROUTES
// ==============================
app.post("/deploy_repo", (req, res) => {
  try {
    const { repo_url } = req.body;
    if (!repo_url) return res.status(400).json({ success: false, message: "Repo URL missing" });

    console.log("Deploying repo:", repo_url);
    // Deployment logic here (git clone etc)
    res.json({ success: true, message: "Repo received, deployment started." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/install_deps", (req, res) => {
  try {
    const { folder } = req.body;
    console.log("Installing dependencies in:", folder);
    // npm install logic here
    res.json({ success: true, message: "Dependencies installation started." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/run_project", (req, res) => {
  try {
    const { folder } = req.body;
    console.log("Running project in:", folder);
    // node server.js or npm start logic here
    res.json({ success: true, message: "Project run started." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// SERVE REACT FRONTEND
// ==============================
if (fs.existsSync(clientBuildPath)) {
  console.log("✅ React build found, serving frontend...");
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  console.log("⚠️ No React build found in client/dist, skipping frontend serving.");
}

// ==============================
// CONNECT TO MONGODB & START SERVER
// ==============================
async function startServer() {
  const isDemo = process.env.DEMO_MODE === "true";

  if (isDemo) {
    console.log("⚠️ DEMO MODE ACTIVE: skipping MongoDB connection.");
  } else {
    try {
      await connectDB();
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.warn("⚠️ MongoDB connection failed. Running in demo mode...");
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
}

startServer();
