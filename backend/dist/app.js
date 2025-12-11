"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const boards_routes_1 = __importDefault(require("./routes/boards.routes"));
const items_routes_1 = __importDefault(require("./routes/items.routes"));
const qaItems_routes_1 = __importDefault(require("./routes/qaItems.routes"));
const sprints_routes_1 = __importDefault(require("./routes/sprints.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const automatedTasks_routes_1 = __importDefault(require("./routes/automatedTasks.routes"));
const bugs_routes_1 = __importDefault(require("./routes/bugs.routes"));
const playwright_routes_1 = __importDefault(require("./routes/playwright.routes"));
const postman_routes_1 = __importDefault(require("./routes/postman.routes"));
const testomat_routes_1 = __importDefault(require("./routes/testomat.routes"));
const drawing_routes_1 = __importDefault(require("./routes/drawing.routes"));
const return_routes_1 = __importDefault(require("./routes/return.routes"));
const app = (0, express_1.default)();
// Configuración de CORS para permitir ngrok y localhost
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:4200',
        'http://localhost:4000',
        'https://flying-pleasing-stag.ngrok-free.app',
        /\.ngrok-free\.app$/, // Permite cualquier subdominio de ngrok-free.app
        /\.ngrok\.io$/ // Permite cualquier subdominio de ngrok.io
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/boards", boards_routes_1.default);
app.use("/api/items", items_routes_1.default);
app.use("/api/qa-items", qaItems_routes_1.default);
app.use("/api/sprints", sprints_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/automated-tasks", automatedTasks_routes_1.default);
app.use("/api/bugs", bugs_routes_1.default);
app.use("/api/playwright", playwright_routes_1.default);
app.use("/api/postman", postman_routes_1.default);
app.use("/api/testomat", testomat_routes_1.default);
app.use("/api/drawing", drawing_routes_1.default);
app.use("/api/returns", return_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map