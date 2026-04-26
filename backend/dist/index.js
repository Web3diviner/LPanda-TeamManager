"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const points_1 = __importDefault(require("./routes/points"));
const recap_1 = __importDefault(require("./routes/recap"));
const announcements_1 = __importDefault(require("./routes/announcements"));
const delegated_1 = __importDefault(require("./routes/delegated"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const timers_1 = __importDefault(require("./routes/timers"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const ambassador_admin_1 = __importDefault(require("./routes/ambassador-admin"));
const scheduler_1 = require("./scheduler");
const app = (0, express_1.default)();
const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: allowedOrigin,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '20mb' })); // allow base64 avatars + screenshots
app.use((0, cookie_parser_1.default)());
app.use('/auth', auth_1.default);
app.use('/tasks', tasks_1.default);
app.use('/points', points_1.default);
app.use('/recap', recap_1.default);
app.use('/announcements', announcements_1.default);
app.use('/delegated', delegated_1.default);
app.use('/notifications', notifications_1.default);
app.use('/feedback', feedback_1.default);
app.use('/timers', timers_1.default);
app.use('/schedule', schedule_1.default);
app.use('/meetings', meetings_1.default);
app.use('/ambassador-admin', ambassador_admin_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
exports.default = app;
if (require.main === module) {
    const PORT = Number(process.env.PORT ?? 3000);
    (0, scheduler_1.startScheduler)();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
