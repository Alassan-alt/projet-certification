"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../prismaClient");
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const requireAuth = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer "))
        return res.status(401).json({ error: "Unauthorized" });
    const token = auth.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prismaClient_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(401).json({ error: "Invalid token (user not found)" });
        req.user = { id: user.id, email: user.email };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
exports.requireAuth = requireAuth;
