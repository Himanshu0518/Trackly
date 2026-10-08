import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
  }),
});

export type SignupBody = z.infer<typeof signupSchema>["body"];
export type LoginBody = z.infer<typeof loginSchema>["body"];
