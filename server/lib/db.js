import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (process.env.DEMO_MODE === "true") {
      console.log("⚠️ Demo mode active: skipping MongoDB connection.");
      return;
    }

    mongoose.connection.on("connected", () => {
      console.log("✅ Database connected");
    });

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log("⚠️ MONGODB_URI not set. Skipping DB connection.");
      return;
    }

    await mongoose.connect(`${mongoUri}/chat-app`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.log("❌ MongoDB connection error:", error.message);
  }
};
