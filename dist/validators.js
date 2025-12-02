"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = exports.groupSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.groupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional()
});
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(["todo", "in_progress", "done"]).optional(),
    deadline: zod_1.z.string().optional(), // ISO date string
    groupId: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().optional()
});
