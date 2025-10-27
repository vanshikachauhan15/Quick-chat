import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import fs from "fs";
import path, { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// ==============================
// FILE PATHS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientBuildPath = path.join(__dirname, "../client/dist");

// ==============================
// EXPRESS APP + HTTP SERVER
const app = express();
const server = http.createServer(app);

// ==============================
// SOCKET.IO SETUP
export const io = new Server(server, { cors: { origin: "*" } });
export const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("⚡ User connected:", userId || "Unknown");

  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId];
    console.log("🚪 User disconnected:", userId || "Unknown");
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ==============================
// MIDDLEWARE
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ==============================
// ROUTES
app.use("/api/status", (req, res) => {
  const demo = process.env.DEMO_MODE === "true";
  res.send(
    `Server is live 🚀 (Database: ${demo ? "Demo mode" : "Connected mode"})`
  );
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ==============================
// SERVE REACT FRONTEND SAFELY
if (fs.existsSync(clientBuildPath)) {
  console.log("✅ React build found, serving frontend...");

  // Serve all static assets
  app.use(express.static(clientBuildPath));

  // Handle React Router fallback (avoid path-to-regexp crash)
  app.all("/*", (req, res) => {
    res.sendFile(resolve(clientBuildPath, "index.html"));
  });
} else {
  console.log("⚠️ No React build found in client/dist, skipping frontend serving.");
}

// ==============================
// CONNECT DB AND START SERVER
async function startServer() {
  const PORT = process.env.PORT || 5001;

  try {
    await connectDB();
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed. Running in demo mode...");
  }

  server.listen(PORT, () => {
    console.log(`✅ Server running on PORT: ${PORT}`);
  });
}

startServer();

