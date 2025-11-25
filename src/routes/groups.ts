import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { groupSchema } from "../validators";

const router = Router();

// Create group
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = groupSchema.parse(req.body);
    const group = await prisma.group.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        ownerId: req.user.id,
        memberIds: [req.user.id]
      }
    });
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Invalid data" });
  }
});

// List groups (user is member)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const groups = await prisma.group.findMany({
    where: { memberIds: { has: req.user.id } }
  });
  res.json(groups);
});

// View single group (members + tasks)
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const gid = req.params.id;
  const group = await prisma.group.findUnique({ where: { id: gid } });
  if (!group) return res.status(404).json({ error: "Group not found" });
  // check membership
  if (!group.memberIds.includes(req.user.id)) return res.status(403).json({ error: "Access denied" });
  const members = await prisma.user.findMany({ where: { id: { in: group.memberIds } }, select: { id: true, email: true, name: true } });
  const tasks = await prisma.task.findMany({ where: { groupId: gid } });
  res.json({ group, members, tasks });
});

// Remove member from group
router.post("/:id/remove", requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.body;
  const gid = req.params.id;
  const group = await prisma.group.findUnique({ where: { id: gid } });
  if (!group) return res.status(404).json({ error: "Group not found" });
  // only owner can remove
  if (group.ownerId !== req.user.id) return res.status(403).json({ error: "Only owner can remove members" });
  const updated = await prisma.group.update({
    where: { id: gid },
    data: { memberIds: group.memberIds.filter((m) => m !== userId) }
  });
  res.json(updated);
});

export default router;
