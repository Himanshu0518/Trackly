import { Router } from "express";
import { getDashboardStats } from "@/controllers/dashboard.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";

const router = Router();

// Requires authentication
router.use(verifyJWT);

// GET /api/dashboard/stats
router.get("/stats", getDashboardStats);

export default router;
