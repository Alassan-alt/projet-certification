"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = require("../prismaClient");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// create task
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const parsed = validators_1.taskSchema.parse(req.body);
        // if groupId provided, ensure user is member
        if (parsed.groupId) {
            const group = await prismaClient_1.prisma.group.findUnique({ where: { id: parsed.groupId } });
            if (!group)
                return res.status(400).json({ error: "Group not found" });
            if (!group.memberIds.includes(req.user.id))
                return res.status(403).json({ error: "Not a member of group" });
        }
        const deadline = parsed.deadline ? new Date(parsed.deadline) : undefined;
        const task = await prismaClient_1.prisma.task.create({
            data: {
                title: parsed.title,
                description: parsed.description,
                status: parsed.status || "todo",
                deadline,
                createdBy: req.user.id,
                assigneeId: parsed.assigneeId,
                groupId: parsed.groupId
            }
        });
        res.json(task);
    }
    catch (err) {
        res.status(400).json({ error: err?.message || "Invalid data" });
    }
});
// list all tasks (user created or within user's groups)
router.get("/", auth_1.requireAuth, async (req, res) => {
    // tasks created by user OR tasks in groups where user is member
    const groups = await prismaClient_1.prisma.group.findMany({ where: { memberIds: { has: req.user.id } }, select: { id: true } });
    const groupIds = groups.map(g => g.id);
    const tasks = await prismaClient_1.prisma.task.findMany({
        where: {
            OR: [
                { createdBy: req.user.id },
                { groupId: { in: groupIds.length ? groupIds : [""] } }
            ]
        }
    });
    res.json(tasks);
});
// update task
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const task = await prismaClient_1.prisma.task.findUnique({ where: { id } });
    if (!task)
        return res.status(404).json({ error: "Task not found" });
    // only creator or group member can edit
    if (task.createdBy !== req.user.id) {
        if (task.groupId) {
            const group = await prismaClient_1.prisma.group.findUnique({ where: { id: task.groupId } });
            if (!group?.memberIds.includes(req.user.id))
                return res.status(403).json({ error: "Not allowed" });
        }
        else
            return res.status(403).json({ error: "Not allowed" });
    }
    const data = {};
    if (req.body.title)
        data.title = req.body.title;
    if (req.body.description)
        data.description = req.body.description;
    if (req.body.status)
        data.status = req.body.status;
    if (req.body.deadline)
        data.deadline = new Date(req.body.deadline);
    if (req.body.assigneeId)
        data.assigneeId = req.body.assigneeId;
    if (req.body.groupId)
        data.groupId = req.body.groupId;
    const updated = await prismaClient_1.prisma.task.update({ where: { id }, data });
    res.json(updated);
});
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const task = await prismaClient_1.prisma.task.findUnique({ where: { id } });
    if (!task)
        return res.status(404).json({ error: "Task not found" });
    if (task.createdBy !== req.user.id)
        return res.status(403).json({ error: "Only creator can delete" });
    await prismaClient_1.prisma.task.delete({ where: { id } });
    res.json({ success: true });
});
router.get("/group/:groupId", auth_1.requireAuth, async (req, res) => {
    const group = await prismaClient_1.prisma.group.findUnique({ where: { id: req.params.groupId } });
    if (!group)
        return res.status(404).json({ error: "Group not found" });
    if (!group.memberIds.includes(req.user.id))
        return res.status(403).json({ error: "Access denied" });
    const tasks = await prismaClient_1.prisma.task.findMany({ where: { groupId: req.params.groupId } });
    res.json(tasks);
});
exports.default = router;
