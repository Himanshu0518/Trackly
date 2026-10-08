import { Router } from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import teamRouter from "./team.router.js";
import issueRouter from "./issue.router.js";
import dashboardRouter from "./dashboard.router.js";

const router = Router();

router.use("/auth",      authRouter);
router.use("/users",     userRouter);
router.use("/teams",     teamRouter);
router.use("/issues",    issueRouter);
router.use("/dashboard", dashboardRouter);

export default router;
