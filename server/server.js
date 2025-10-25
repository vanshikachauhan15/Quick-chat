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

// ==============================
// FILE PATHS (ES Module fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, "../client/dist");

// ==============================
// CREATE EXPRESS APP AND HTTP SERVER
const app = express();
const server = http.createServer(app);

// ==============================
// INITIALIZE SOCKET.IO SERVER
export const io = new Server(server, { cors: { origin: "*" } });
export const userSocketMap = {}; // {userId: socketId}

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
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ==============================
// API ROUTES
app.use("/api/status", (req, res) => {
  res.send("Server is live (demo mode if DB not connected)");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ==============================
// SERVE REACT FRONTEND
if (fs.existsSync(clientBuildPath)) {
  console.log("✅ React build found, serving frontend...");

  app.use(express.static(clientBuildPath));

  // Safe catch-all: any unknown route serves index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  console.log("⚠️ No React build found in client/dist, skipping frontend serving.");
}

// ==============================
// SAFE CATCH FOR INVALID ROUTES
app.use((req, res, next) => {
  if (req.path.startsWith("http") || req.path.includes("://")) {
    console.warn("Invalid route path detected:", req.path);
    return res.status(400).send("Bad route path.");
  }
  next();
});

// ==============================
// CONNECT TO MONGODB (DEMO-SAFE) & START SERVER
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

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
}

startServer();
