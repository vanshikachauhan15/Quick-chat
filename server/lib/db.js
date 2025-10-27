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
      console.log("❌ MONGODB_URI not found in environment variables!");
      return;
    }

    // If the URI already includes a DB name, don't append /chat-app
    const fullUri = mongoUri.includes(".net/")
      ? mongoUri
      : `${mongoUri}/chat-app`;

    // MongoDB connection event listeners
    mongoose.connection.on("connected", () => {
      console.log("✅ Database connected successfully!");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected.");
    });

    // Connect to MongoDB
    await mongoose.connect(fullUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
  }
};

