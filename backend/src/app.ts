import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


import authRoutes from "./routes/auth.routes";
import boardRoutes from "./routes/boards.routes";
import itemRoutes from "./routes/items.routes";
import qaItemsRoutes from "./routes/qaItems.routes";
import sprintsRoutes from "./routes/sprints.routes";
import usersRoutes from "./routes/users.routes";
import automatedTasksRoutes from "./routes/automatedTasks.routes";
import bugsRoutes from "./routes/bugs.routes";
import playwrightRoutes from "./routes/playwright.routes";
import postmanRoutes from "./routes/postman.routes";
import testomatRoutes from "./routes/testomat.routes";
import drawingRoutes from "./routes/drawing.routes";
import returnRoutes from "./routes/return.routes";
import requirementAnalysisRoutes from "./routes/requirementAnalysis.routes";
import avalRoutes from "./routes/aval.routes";

const app = express();

// Configuración de CORS para permitir ngrok, localhost e IPs locales
app.use(cors({
  origin: [
    'http://localhost:4300',
    'http://localhost:4100',
    'https://flying-pleasing-stag.ngrok-free.app',
    /^http:\/\/192\.168\.\d+\.\d+:4300$/,  // Permite cualquier IP 192.168.x.x:4300
    /^http:\/\/10\.\d+\.\d+\.\d+:4300$/,   // Permite cualquier IP 10.x.x.x:4300
    /\.ngrok-free\.app$/,  // Permite cualquier subdominio de ngrok-free.app
    /\.ngrok\.io$/         // Permite cualquier subdominio de ngrok.io
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/qa-items", qaItemsRoutes);
app.use("/api/sprints", sprintsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/automated-tasks", automatedTasksRoutes);
app.use("/api/bugs", bugsRoutes);
app.use("/api/playwright", playwrightRoutes);
app.use("/api/postman", postmanRoutes);
app.use("/api/testomat", testomatRoutes);
app.use("/api/drawing", drawingRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/requirement-analysis", requirementAnalysisRoutes);
app.use("/api/avales", avalRoutes);

export default app;
