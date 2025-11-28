import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { makeInviteToken } from "../utils";

const router = Router();

// create invite (owner only)
router.post("/:groupId/create", requireAuth, async (req: AuthRequest, res) => {
  const groupId = req.params.groupId;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (group.ownerId !== req.user.id) return res.status(403).json({ error: "Only owner can create invites" });

  const token = makeInviteToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // expire in 7 days

  const invite = await prisma.invite.create({
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
  token: invite.token   // <= ajoute ceci !
});

});

// accept invite: user must be authenticated
router.post("/accept", requireAuth, async (req: AuthRequest, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (invite.used) return res.status(400).json({ error: "Invite already used" });
  if (invite.expiresAt && invite.expiresAt < new Date())
    return res.status(400).json({ error: "Invite expired" });

  // Vérification group
  const group = await prisma.group.findUnique({ where: { id: invite.groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });

  // Ajouter l'utilisateur
  if (!group.memberIds.includes(req.user.id)) {
    await prisma.group.update({
      where: { id: group.id },
      data: { memberIds: [...group.memberIds, req.user.id] }
    });
  }

  // Marquer comme utilisé
  await prisma.invite.update({
    where: { id: invite.id },
    data: { used: true }
  });

  res.json({ success: true, groupId: group.id });
});


export default router;
