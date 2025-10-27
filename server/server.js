import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// load env variables
dotenv.config();

// express app
const app = express();
app.use(express.json());
app.use(cors());

// database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// your API routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running fine 🚀" });
});

// socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// serve frontend (for production build)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientPath));

// ✅ this route works fine in Express 4 & 5
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


