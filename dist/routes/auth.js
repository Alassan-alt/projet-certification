"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../prismaClient");
const validators_1 = require("../validators");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES = "7d";
router.post("/register", async (req, res) => {
    try {
        const parsed = validators_1.registerSchema.parse(req.body);
        const existing = await prismaClient_1.prisma.user.findUnique({ where: { email: parsed.email } });
        if (existing)
            return res.status(400).json({ error: "Email déjà utilisé" });
        const password = await (0, utils_1.hashPassword)(parsed.password);
        const user = await prismaClient_1.prisma.user.create({ data: { email: parsed.email, password, name: parsed.name } });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (err) {
        res.status(400).json({ error: err?.message || "Invalid data" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const parsed = validators_1.loginSchema.parse(req.body);
        const user = await prismaClient_1.prisma.user.findUnique({ where: { email: parsed.email } });
        if (!user)
            return res.status(400).json({ error: "Email ou mot de passe invalide" });
        const ok = await (0, utils_1.comparePassword)(parsed.password, user.password);
        if (!ok)
            return res.status(400).json({ error: "Email ou mot de passe invalide" });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (err) {
        res.status(400).json({ error: err?.message || "Invalid data" });
    }
});
exports.default = router;
