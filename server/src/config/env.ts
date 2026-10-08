import dotenv from "dotenv";
dotenv.config();

const env = {
  DATABASE_URI: process.env.DATABASE_URI || "",
  PORT: process.env.PORT || "3000",
  JWT_SECRET: process.env.JWT_SECRET || "my-secret-key",
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};

export default env;
