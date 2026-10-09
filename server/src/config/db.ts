
import mongoose from "mongoose";
import dns from "node:dns";
import env from "./env.js";

// Workaround for the default DNS resolver failing SRV lookups
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async () => {
  try {
    const url = new URL(env.DATABASE_URI);

    // Set the database name if none is specified
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/trackly";
    }

    await mongoose.connect(url.toString());

    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("Unable to connect with DB:", e);
    throw new Error("Database connection failed");
  }
};
