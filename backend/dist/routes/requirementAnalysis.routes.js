"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const requirementAnalysis_controller_1 = require("../controllers/requirementAnalysis.controller");
const router = (0, express_1.Router)();
// Multer en memoria para archivos adjuntos (max 15MB por archivo, máx 5 archivos)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            // Imágenes para OCR
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/tiff",
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}. Se aceptan PDF, DOCX, DOC, TXT, PNG, JPG, WEBP.`));
        }
    },
});
/**
 * Analizar Historia de Usuario desde Jira
 * POST /api/requirement-analysis/analyze
 */
router.post("/analyze", requirementAnalysis_controller_1.analyzeRequirement);
/**
 * Analizar HU con archivos adjuntos (PDF, DOCX, TXT)
 * POST /api/requirement-analysis/analyze-with-files
 * multipart/form-data: customText (string), files[] (archivos)
 */
router.post("/analyze-with-files", upload.array("files", 5), requirementAnalysis_controller_1.analyzeRequirementWithFiles);
/**
 * Publicar análisis como PDF en Jira
 * POST /api/requirement-analysis/publish-to-jira
 */
router.post("/publish-to-jira", requirementAnalysis_controller_1.publishAnalysisToJira);
/**
 * Flujo completo: analizar y publicar
 * POST /api/requirement-analysis/analyze-and-publish
 */
router.post("/analyze-and-publish", requirementAnalysis_controller_1.analyzeAndPublish);
/**
 * Publicar análisis como comentario formateado directamente en Jira
 * POST /api/requirement-analysis/comment-on-jira
 * Body: { jiraUrl, analysisData? } | { jiraUrl, customText? }
 */
router.post("/comment-on-jira", requirementAnalysis_controller_1.commentOnJira);
exports.default = router;
//# sourceMappingURL=requirementAnalysis.routes.js.map