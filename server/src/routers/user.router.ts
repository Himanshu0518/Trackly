import { Router } from "express";
import { getMe, updateMe } from "@/controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";

const router = Router();

// All user routes require authentication
router.use(verifyJWT);

// GET  /api/users/me
router.get("/me", getMe);

// PATCH /api/users/me
router.patch("/me", updateMe);

export default router;
