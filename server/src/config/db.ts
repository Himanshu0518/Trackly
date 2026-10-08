import mongoose from "mongoose";
import env from "./env.js";

export const connectDB = async () => {
  try {
    console.log("DB URL = ", env.DATABASE_URI);
    await mongoose.connect(env.DATABASE_URI);
  } catch (e) {
    console.log("unable to connect with DB");
    throw Error("Database connection failed");
  }
};
