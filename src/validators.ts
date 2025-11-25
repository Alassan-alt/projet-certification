import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  deadline: z.string().optional(), // ISO date string
  groupId: z.string().optional(),
  assigneeId: z.string().optional()
});
