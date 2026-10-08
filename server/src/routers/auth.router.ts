import { Router } from "express";
import { signup, login, logout } from "@/controllers/auth.controller.js";
import { validate } from "@/middlewares/validate.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";
import { signupSchema, loginSchema } from "@/validators/auth.validator.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), signup);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// POST /api/auth/logout  (must be logged in to log out)
router.post("/logout", verifyJWT, logout);

export default router;
