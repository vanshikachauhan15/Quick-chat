import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// ==============================
// CREATE EXPRESS APP AND HTTP SERVER
// ==============================
const app = express();
const server = http.createServer(app);

// ==============================
// INITIALIZE SOCKET.IO SERVER
// ==============================
export const io = new Server(server, {
  cors: { origin: "*" },
});

// STORE ONLINE USERS
export const userSocketMap = {}; // {userId: socketId}

// SOCKET.IO CONNECTION HANDLER
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);
  if (userId) userSocketMap[userId] = socket.id;

  // EMIT ONLINE USERS TO ALL CONNECTED CLIENTS
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ==============================
// MIDDLEWARE SETUP
// ==============================
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ==============================
// ROUTES SETUP
// ==============================
app.use("/api/status", (req, res) => {
  res.send("Server is live (demo mode if DB not connected)");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ==============================
// CONNECT TO MONGODB (DEMO-SAFE)
// ==============================
async function startServer() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.warn(
      "⚠️ MongoDB connection failed. Running in demo mode... You can still use the server!"
    );
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
}

startServer();
