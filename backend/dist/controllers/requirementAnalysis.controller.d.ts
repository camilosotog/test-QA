import { Request, Response } from "express";
/**
 * Analiza una Historia de Usuario y detecta ambigüedades
 * POST /api/requirement-analysis/analyze
 */
export declare const analyzeRequirement: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Analiza una HU con archivos adjuntos opcionales (PDF, DOCX, TXT)
 * POST /api/requirement-analysis/analyze-with-files
 * multipart/form-data: customText (string), files[] (archivos)
 */
export declare const analyzeRequirementWithFiles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Genera PDF y lo sube como comentario en Jira
 * POST /api/requirement-analysis/publish-to-jira
 */
export declare const publishAnalysisToJira: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Publica el análisis como comentario formateado en Jira
 * POST /api/requirement-analysis/comment-on-jira
 * Body: { jiraUrl, analysisData } o { jiraUrl, customText } para analizar y comentar en un paso
 */
export declare const commentOnJira: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Flujo completo: analizar y publicar en Jira
 * POST /api/requirement-analysis/analyze-and-publish
 */
export declare const analyzeAndPublish: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    analyzeRequirement: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    publishAnalysisToJira: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    analyzeAndPublish: (req: Request, res: Response) => Promise<void>;
    commentOnJira: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=requirementAnalysis.controller.d.ts.map