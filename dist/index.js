"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const groups_1 = __importDefault(require("./routes/groups"));
const invites_1 = __importDefault(require("./routes/invites"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || true }));
app.use((0, express_rate_limit_1.default)({ windowMs: 1 * 60 * 1000, max: 100 })); // basique
app.get("/", (req, res) => res.json({ ok: true, version: "1.0" }));
app.get("/test", (req, res) => {
    res.send("OK");
});
app.use("/api/auth", auth_1.default);
app.use("/api/groups", groups_1.default);
app.use("/api/invites", invites_1.default);
app.use("/api/tasks", tasks_1.default);
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
});
const port = process.env.PORT || 4000;
app.listen(port, async () => {
    console.log(`Server listening on ${port}`);
});
