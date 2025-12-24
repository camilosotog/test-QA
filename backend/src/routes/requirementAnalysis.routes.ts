import { Router } from "express";
import {
  analyzeRequirement,
  publishAnalysisToJira,
  analyzeAndPublish,
} from "../controllers/requirementAnalysis.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * Analizar Historia de Usuario desde Jira
 * POST /api/requirement-analysis/analyze
 */
router.post("/analyze", analyzeRequirement);

/**
 * Publicar análisis como PDF en Jira
 * POST /api/requirement-analysis/publish-to-jira
 */
router.post("/publish-to-jira", publishAnalysisToJira);

/**
 * Flujo completo: analizar y publicar
 * POST /api/requirement-analysis/analyze-and-publish
 */
router.post("/analyze-and-publish", analyzeAndPublish);

export default router;
