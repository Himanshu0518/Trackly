import { Router } from "express";
import { getMe, updateMe, searchUsers, getMyStats } from "@/controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/me",       getMe);
router.get("/me/stats", getMyStats);
router.patch("/me",     updateMe);
router.get("/search",   searchUsers);

export default router;
