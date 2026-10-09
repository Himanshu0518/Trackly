import { Router } from "express";
import {
  createTeam,
  getMyTeam,
  getTeamMembers,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  exitTeam,
} from "@/controllers/team.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";
import { verifyAdmin } from "@/middlewares/verifyAdmin.middleware.js";
import { validate } from "@/middlewares/validate.js";
import {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  removeMemberSchema,
} from "@/validators/team.validator.js";

const router = Router();

// All team routes require authentication
router.use(verifyJWT);

// Any authenticated user
router.post("/", validate(createTeamSchema), createTeam);
router.get("/my", getMyTeam);
router.get("/my/members", getTeamMembers);
router.post("/my/exit", exitTeam);

// ADMIN only
router.patch("/my", verifyAdmin, validate(updateTeamSchema), updateTeam);
router.delete("/my", verifyAdmin, deleteTeam);
router.post("/my/members", verifyAdmin, validate(addMemberSchema), addMember);
router.delete(
  "/my/members/:memberId",
  verifyAdmin,
  validate(removeMemberSchema),
  removeMember
);

export default router;
