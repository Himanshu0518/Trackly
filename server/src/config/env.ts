import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

// Never fall back to a hardcoded secret in production — an unsigned JWT
// forge would give anyone admin access. Fail fast instead.
if (NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET must be set in production — refusing to start with a default secret"
  );
}

const env = {
  DATABASE_URI: process.env.DATABASE_URI || "",
  PORT: process.env.PORT || "3000",
  // Dev-only fallback for local convenience; see guard above for prod
  JWT_SECRET: process.env.JWT_SECRET || "my-secret-key",
  NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};

export default env;
