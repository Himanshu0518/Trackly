import { Router } from "express";
import { getMe, updateMe, searchUsers } from "@/controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";

const router = Router();

// All user routes require authentication
router.use(verifyJWT);

// GET  /api/users/me
router.get("/me", getMe);

// PATCH /api/users/me
router.patch("/me", updateMe);

// GET /api/users/search?q=<query>
router.get("/search", searchUsers);

export default router;
