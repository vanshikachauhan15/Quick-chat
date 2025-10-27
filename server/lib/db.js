import mongoose from "mongoose";

// Function to connect to MongoDB
export const connectDB = async () => {
  try {
    // Skip connection if demo mode is active
    if (process.env.DEMO_MODE === "true") {
      console.log("⚠️ Demo mode active: skipping MongoDB connection.");
      return;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables!");
      return;
    }

    // ✅ Use the URI directly — don't modify
    const fullUri = mongoUri;

    // Event listeners
    mongoose.connection.on("connected", () => {
      console.log("✅ Database connected successfully!");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected.");
    });

    // ✅ Connect to MongoDB (no deprecated options)
    await mongoose.connect(fullUri);

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
  }
};

