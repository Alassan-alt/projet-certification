"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = require("../prismaClient");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// Create group
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const parsed = validators_1.groupSchema.parse(req.body);
        const group = await prismaClient_1.prisma.group.create({
            data: {
                name: parsed.name,
                description: parsed.description,
                ownerId: req.user.id,
                memberIds: [req.user.id]
            }
        });
        res.json(group);
    }
    catch (err) {
        res.status(400).json({ error: err?.message || "Invalid data" });
    }
});
// List groups (user is member)
router.get("/", auth_1.requireAuth, async (req, res) => {
    const groups = await prismaClient_1.prisma.group.findMany({
        where: { memberIds: { has: req.user.id } }
    });
    res.json(groups);
});
// View single group (members + tasks)
router.get("/:id", auth_1.requireAuth, async (req, res) => {
    const gid = req.params.id;
    const group = await prismaClient_1.prisma.group.findUnique({ where: { id: gid } });
    if (!group)
        return res.status(404).json({ error: "Group not found" });
    // check membership
    if (!group.memberIds.includes(req.user.id))
        return res.status(403).json({ error: "Access denied" });
    const members = await prismaClient_1.prisma.user.findMany({ where: { id: { in: group.memberIds } }, select: { id: true, email: true, name: true } });
    const tasks = await prismaClient_1.prisma.task.findMany({ where: { groupId: gid } });
    res.json({ group, members, tasks });
});
// Remove member from group
router.post("/:id/remove", auth_1.requireAuth, async (req, res) => {
    const { userId } = req.body;
    const gid = req.params.id;
    const group = await prismaClient_1.prisma.group.findUnique({ where: { id: gid } });
    if (!group)
        return res.status(404).json({ error: "Group not found" });
    // only owner can remove
    if (group.ownerId !== req.user.id)
        return res.status(403).json({ error: "Only owner can remove members" });
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: gid },
        data: { memberIds: group.memberIds.filter((m) => m !== userId) }
    });
    res.json(updated);
});
exports.default = router;
