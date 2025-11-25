import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { taskSchema } from "../validators";



const router = Router();

// create task
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = taskSchema.parse(req.body);
    // if groupId provided, ensure user is member
    if (parsed.groupId) {
      const group = await prisma.group.findUnique({ where: { id: parsed.groupId } });
      if (!group) return res.status(400).json({ error: "Group not found" });
      if (!group.memberIds.includes(req.user.id)) return res.status(403).json({ error: "Not a member of group" });
    }
    const deadline = parsed.deadline ? new Date(parsed.deadline) : undefined;
    const task = await prisma.task.create({
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
  } catch (err) {
    res.status(400).json({ error: err?.message || "Invalid data" });
  }
});

// list all tasks (user created or within user's groups)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  // tasks created by user OR tasks in groups where user is member
  const groups = await prisma.group.findMany({ where: { memberIds: { has: req.user.id }}, select: { id: true } });
  const groupIds = groups.map(g => g.id);
  const tasks = await prisma.task.findMany({
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
router.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ error: "Task not found" });
  // only creator or group member can edit
  if (task.createdBy !== req.user.id) {
    if (task.groupId) {
      const group = await prisma.group.findUnique({ where: { id: task.groupId } });
      if (!group?.memberIds.includes(req.user.id)) return res.status(403).json({ error: "Not allowed" });
    } else return res.status(403).json({ error: "Not allowed" });
  }
  const data: any = {};
  if (req.body.title) data.title = req.body.title;
  if (req.body.description) data.description = req.body.description;
  if (req.body.status) data.status = req.body.status;
  if (req.body.deadline) data.deadline = new Date(req.body.deadline);
  if (req.body.assigneeId) data.assigneeId = req.body.assigneeId;
  if (req.body.groupId) data.groupId = req.body.groupId;
  const updated = await prisma.task.update({ where: { id }, data });
  res.json(updated);
});


router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (task.createdBy !== req.user.id) return res.status(403).json({ error: "Only creator can delete" });
  await prisma.task.delete({ where: { id } });
  res.json({ success: true });
});


router.get("/group/:groupId", requireAuth, async (req: AuthRequest, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.groupId }});
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.memberIds.includes(req.user.id)) return res.status(403).json({ error: "Access denied" });
  const tasks = await prisma.task.findMany({ where: { groupId: req.params.groupId }});
  res.json(tasks);
});

export default router;
