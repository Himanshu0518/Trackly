import { Router } from "express";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  deleteComment,
} from "@/controllers/issue.controller.js";
import { verifyJWT } from "@/middlewares/auth.middleware.js";
import { validate } from "@/middlewares/validate.js";
import {
  createIssueSchema,
  updateIssueSchema,
  addCommentSchema,
} from "@/validators/issue.validator.js";

const router = Router();

// All issue routes require authentication
router.use(verifyJWT);

// Issues CRUD
router.get("/", getIssues);
router.get("/:id", getIssueById);
router.post("/", validate(createIssueSchema), createIssue);
router.patch("/:id", validate(updateIssueSchema), updateIssue);
router.delete("/:id", deleteIssue);

// Comments
router.post("/:id/comments", validate(addCommentSchema), addComment);
router.delete("/:id/comments/:commentIndex", deleteComment);

export default router;
