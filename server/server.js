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
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

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

// 🧩 Track which socket belongs to which user
const userSocketMap = new Map(); // userId → socket.id

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  }

  // ✅ Handle new message
  socket.on("newMessage", (message) => {
    const receiverSocketId = userSocketMap.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    for (const [id, sockId] of userSocketMap.entries()) {
      if (sockId === socket.id) {
        userSocketMap.delete(id);
        break;
      }
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Export for other modules
export { io, userSocketMap };

