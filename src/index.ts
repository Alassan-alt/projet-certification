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


const allowedOrigins = [
  "http://localhost:5173",
  "https://projet-certification-frontend.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));

app.get("/", (req, res) => res.json({ ok: true, version: "1.0" }));
app.get("/test", (req, res) => res.send("OK"));

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
// Test DB connection
prisma.$connect().then(() => {
  console.log("✅ Connected to database");
}).catch((err) => {
  console.error("❌ Database connection error:", err);
});

export default app;
