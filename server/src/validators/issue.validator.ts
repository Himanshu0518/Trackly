import { z } from "zod";

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").trim(),
    description: z.string().min(1, "Description is required").trim(),
    type: z.enum(["BUG", "FEATURE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    assignedTo: z.string().optional().nullable(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  }),
});

export const updateIssueSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    description: z.string().min(1).trim().optional(),
    type: z.enum(["BUG", "FEATURE"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    assignedTo: z.string().nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Comment text is required").trim(),
  }),
});

export type CreateIssueBody = z.infer<typeof createIssueSchema>["body"];
export type UpdateIssueBody = z.infer<typeof updateIssueSchema>["body"];
export type AddCommentBody = z.infer<typeof addCommentSchema>["body"];
