import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";
import { registerSchema, loginSchema } from "../validators";
import { hashPassword, comparePassword } from "../utils";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES = "7d";

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return res.status(400).json({ error: "Email déjà utilisé" });
    const password = await hashPassword(parsed.password);
    const user = await prisma.user.create({ data: { email: parsed.email, password, name: parsed.name } });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(400).json({ error: err?.message || "Invalid data" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) return res.status(400).json({ error: "Email ou mot de passe invalide" });
    const ok = await comparePassword(parsed.password, user.password);
    if (!ok) return res.status(400).json({ error: "Email ou mot de passe invalide" });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(400).json({ error: err?.message || "Invalid data" });
  }
});

export default router;
