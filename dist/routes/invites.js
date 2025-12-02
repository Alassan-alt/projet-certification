"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = require("../prismaClient");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
// create invite (owner only)
router.post("/:groupId/create", auth_1.requireAuth, async (req, res) => {
    const groupId = req.params.groupId;
    const group = await prismaClient_1.prisma.group.findUnique({ where: { id: groupId } });
    if (!group)
        return res.status(404).json({ error: "Group not found" });
    if (group.ownerId !== req.user.id)
        return res.status(403).json({ error: "Only owner can create invites" });
    const token = (0, utils_1.makeInviteToken)();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // expire in 7 days
    const invite = await prismaClient_1.prisma.invite.create({
        data: {
            groupId,
            token,
            createdBy: req.user.id,
            expiresAt: expires
        }
    });
    // return a full link the frontend can use; front must call /invites/accept?token=...
    const inviteLink = `${process.env.APP_URL || "http://localhost:5173"}/invites/accept?token=${invite.token}`;
    res.json({
        invite,
        link: inviteLink,
        token: invite.token // <= ajoute ceci !
    });
});
// accept invite: user must be authenticated
router.post("/accept", auth_1.requireAuth, async (req, res) => {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ error: "token required" });
    const invite = await prismaClient_1.prisma.invite.findUnique({ where: { token } });
    if (!invite)
        return res.status(404).json({ error: "Invite not found" });
    if (invite.used)
        return res.status(400).json({ error: "Invite already used" });
    if (invite.expiresAt && invite.expiresAt < new Date())
        return res.status(400).json({ error: "Invite expired" });
    // Vérification group
    const group = await prismaClient_1.prisma.group.findUnique({ where: { id: invite.groupId } });
    if (!group)
        return res.status(404).json({ error: "Group not found" });
    // Ajouter l'utilisateur
    if (!group.memberIds.includes(req.user.id)) {
        await prismaClient_1.prisma.group.update({
            where: { id: group.id },
            data: { memberIds: [...group.memberIds, req.user.id] }
        });
    }
    // Marquer comme utilisé
    await prismaClient_1.prisma.invite.update({
        where: { id: invite.id },
        data: { used: true }
    });
    res.json({ success: true, groupId: group.id });
});
exports.default = router;
