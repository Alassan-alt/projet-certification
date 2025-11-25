import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import inviteRoutes from "./routes/invites";
import taskRoutes from "./routes/tasks";
import { prisma } from "./prismaClient";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 })); // basique

app.get("/", (req, res) => res.json({ ok: true, version: "1.0" }));
app.get("/test", (req, res) => {
  res.send("OK");
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/tasks", taskRoutes);


app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  console.log(`Server listening on ${port}`);
  
});
