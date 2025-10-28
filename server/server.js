import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const server = createServer(app);

// ✅ Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ✅ Database connection
if (process.env.DEMO_MODE !== "true") {
  connectDB();
} else {
  console.log("⚠️ Demo mode active: skipping MongoDB connection.");
}

// ✅ Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.userId = userId;
    onlineUsers.add(userId);
    io.emit("getOnlineUsers", Array.from(onlineUsers));
  }

  // ✅ Handle new message
  socket.on("newMessage", (message) => {
    if (message.receiverId) {
      io.to(message.receiverId).emit("newMessage", message);
    }
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("getOnlineUsers", Array.from(onlineUsers));
    }
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

