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
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ added
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

// ✅ Test Route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend is live!" });
});

// ✅ Root route
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
    credentials: true,
  },
  pingTimeout: 60000, // ✅ helps maintain stable socket connections
});

const userSocketMap = new Map(); // userId → socket.id

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  }

  socket.on("newMessage", (message) => {
    if (!message?.receiverId) return;
    const receiverSocketId = userSocketMap.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
    const userEntry = [...userSocketMap.entries()].find(
      ([, sockId]) => sockId === socket.id
    );
    if (userEntry) userSocketMap.delete(userEntry[0]);
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export { io, userSocketMap };

