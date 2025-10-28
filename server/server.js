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
// FILE PATHS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, "../client/dist");

// ==============================
// EXPRESS APP + HTTP SERVER
const app = express();
const server = http.createServer(app);

// ==============================
// SOCKET.IO SETUP
export const io = new Server(server, {
  cors: { origin: "*" },
});

export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("🟢 User connected:", userId || "Unknown");

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId];
    console.log("🔴 User disconnected:", userId || "Unknown");
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ==============================
// MIDDLEWARE
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ==============================
// ROUTES
app.use("/api/status", (req, res) =>
  res.send("✅ Server is live (demo mode if DB not connected)")
);

// ⚙️ Updated route mount path
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

// ==============================
// SERVE REACT FRONTEND
if (fs.existsSync(clientBuildPath)) {
  console.log("✅ React build found, serving frontend...");
  app.use(express.static(clientBuildPath));

  // Catch-all route for React SPA
  app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  console.log("⚠️ No React build found in client/dist, skipping frontend serving.");
}

// ==============================
// CONNECT DB AND START SERVER
async function startServer() {
  if (process.env.DEMO_MODE === "true") {
    console.log("⚠️ DEMO MODE ACTIVE: skipping MongoDB connection.");
  } else {
    try {
      await connectDB();
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.warn("⚠️ MongoDB connection failed. Switching to demo mode...");
      process.env.DEMO_MODE = "true";
    }
  }

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`🚀 Server running on PORT: ${PORT}`));
}

startServer();

