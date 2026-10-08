import { z } from "zod";

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Team name is required").trim(),
    description: z.string().trim().default(""),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    description: z.string().trim().optional(),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    memberId: z.string().min(1, "memberId is required"),
  }),
});

export type CreateTeamBody = z.infer<typeof createTeamSchema>["body"];
export type UpdateTeamBody = z.infer<typeof updateTeamSchema>["body"];
export type AddMemberBody = z.infer<typeof addMemberSchema>["body"];
