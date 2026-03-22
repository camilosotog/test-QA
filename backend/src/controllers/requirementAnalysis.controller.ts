import { Request, Response } from "express";
import RequirementAnalyzer from "../mcp/requirement-analyzer-mcp";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

const analyzer = new RequirementAnalyzer();

/**
 * Extrae texto de un archivo adjunto según su mimetype
 */
const extractTextFromFile = async (file: Express.Multer.File): Promise<string> => {
  const { mimetype, buffer, originalname } = file;

  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    // Si el PDF es una imagen escaneada, el texto extraído estará vacío
    if (data.text.trim().length < 20) {
      console.log(`[OCR] PDF "${originalname}" parece escaneado, intentando OCR...`);
      const { data: ocrData } = await Tesseract.recognize(buffer, "spa+eng", {
        logger: () => {}, // silenciar logs de progreso
      });
      return `\n\n--- Contenido de adjunto (OCR): ${originalname} ---\n${ocrData.text}`;
    }
    return `\n\n--- Contenido de adjunto: ${originalname} ---\n${data.text}`;
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return `\n\n--- Contenido de adjunto: ${originalname} ---\n${result.value}`;
  }

  if (mimetype === "text/plain") {
    return `\n\n--- Contenido de adjunto: ${originalname} ---\n${buffer.toString("utf-8")}`;
  }

  // Imágenes: OCR con Tesseract
  if (mimetype.startsWith("image/")) {
    console.log(`[OCR] Procesando imagen "${originalname}"...`);
    const { data: ocrData } = await Tesseract.recognize(buffer, "spa+eng", {
      logger: () => {},
    });
    const extractedText = ocrData.text.trim();
    if (!extractedText) {
      return `\n\n--- Adjunto: ${originalname} (sin texto detectable) ---`;
    }
    return `\n\n--- Contenido de adjunto (OCR): ${originalname} ---\n${extractedText}`;
  }

  return "";
};

/**
 * Obtiene una Historia de Usuario desde Jira por URL
 */
const fetchJiraIssue = async (jiraUrl: string): Promise<string> => {
  try {
    // Extraer issue key de la URL (ej: PROJ-123)
    const issueKeyMatch = jiraUrl.match(/([A-Z]+-\d+)/);
    if (!issueKeyMatch) {
      throw new Error("URL de Jira inválida. Formato esperado: .../browse/PROJ-123");
    }

    const issueKey = issueKeyMatch[1];
    const jiraDomain = jiraUrl.split("/browse/")[0];

    // Obtener datos de Jira (requiere token de API)
    const jiraApiUrl = `${jiraDomain}/rest/api/3/issue/${issueKey}`;
    const jiraToken = process.env.JIRA_API_TOKEN;
    const jiraEmail = process.env.JIRA_EMAIL;

    if (!jiraToken || !jiraEmail) {
      throw new Error("Credenciales de Jira no configuradas");
    }

    const response = await axios.get(jiraApiUrl, {
      auth: {
        username: jiraEmail,
        password: jiraToken,
      },
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    // Extraer descripción y título
    const issue = response.data;
    const description = issue.fields.description?.content
      ? issue.fields.description.content
          .map(
            (block: {
              content?: Array<{ text: string; type: string }>;
              type: string;
            }) => {
              if (block.type === "paragraph" && block.content) {
                return block.content.map((c) => c.text).join("");
              }
              return "";
            }
          )
          .join("\n")
      : issue.fields.description || "";

    const summary = issue.fields.summary || "";

    return `${summary}\n\n${description}`;
  } catch (error) {
    const code = (error as any)?.code;
    const status = (error as any)?.response?.status;
    if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      console.error(`[Jira] No se pudo conectar a ${jiraUrl.split("/browse/")[0]} (${code})`);
    } else {
      console.error(`[Jira] Error al obtener issue (${status || code || "desconocido"}):`, (error as Error).message);
    }
    throw error;
  }
};

/**
 * Analiza una Historia de Usuario y detecta ambigüedades
 * POST /api/requirement-analysis/analyze
 */
export const analyzeRequirement = async (req: Request, res: Response) => {
  try {
    const { jiraUrl, customText } = req.body;

    let huText = customText || "";

    // Intentar obtener HU desde Jira si se proporciona URL
    if (jiraUrl) {
      try {
        huText = await fetchJiraIssue(jiraUrl);
      } catch (jiraError) {
        console.warn("No se pudo obtener issue de Jira, usando texto personalizado:", jiraError);
        // Continuar con customText si se proporciona
        if (!customText) {
          const code = (jiraError as any)?.code;
          const httpStatus = (jiraError as any)?.response?.status;
          let friendlyMsg = "No se pudo conectar a Jira.";
          if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
            friendlyMsg = `No se puede alcanzar el servidor Jira. Verifica tu red o VPN.`;
          } else if (code === "ETIMEDOUT") {
            friendlyMsg = "Tiempo de espera agotado al conectar con Jira. Verifica tu red.";
          } else if (httpStatus === 401 || httpStatus === 403) {
            friendlyMsg = "Credenciales de Jira inválidas o sin permisos para esta issue.";
          } else if (httpStatus === 404) {
            friendlyMsg = "La issue de Jira no existe o no es accesible.";
          }
          return res.status(400).json({
            success: false,
            message: friendlyMsg,
            error: jiraError instanceof Error ? jiraError.message : "Error desconocido",
          });
        }
      }
    }

    if (!huText) {
      return res.status(400).json({
        success: false,
        message: "Se requiere jiraUrl o customText",
      });
    }

    // Analizar con MCP
    const analysis = await analyzer.analyzeHU(huText);

    // Generar contenido PDF
    const pdfContent = analyzer.generatePDFContent(analysis);

    res.json({
      success: true,
      data: {
        analysis,
        pdfContent,
      },
      message: "Análisis completado exitosamente",
    });
  } catch (error) {
    console.error("Error en análisis:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Error al analizar requerimiento",
    });
  }
};

/**
 * Analiza una HU con archivos adjuntos opcionales (PDF, DOCX, TXT)
 * POST /api/requirement-analysis/analyze-with-files
 * multipart/form-data: customText (string), files[] (archivos)
 */
export const analyzeRequirementWithFiles = async (req: Request, res: Response) => {
  try {
    const { customText } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!customText && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere al menos customText o un archivo adjunto",
      });
    }

    // Extraer texto de todos los archivos adjuntos en paralelo
    const fileTexts = await Promise.all(files.map(extractTextFromFile));
    const attachmentsText = fileTexts.join("");

    // Combinar texto principal + contenido de adjuntos
    const huText = (customText || "") + attachmentsText;

    if (!huText.trim()) {
      return res.status(400).json({
        success: false,
        message: "No se pudo extraer texto del contenido proporcionado",
      });
    }

    // Analizar con MCP
    const analysis = await analyzer.analyzeHU(huText);
    const pdfContent = analyzer.generatePDFContent(analysis);

    res.json({
      success: true,
      data: {
        analysis,
        pdfContent,
        attachmentsSummary: files.map((f) => ({
          name: f.originalname,
          type: f.mimetype,
          size: `${(f.size / 1024).toFixed(1)} KB`,
        })),
      },
      message: `Análisis completado. ${files.length > 0 ? `${files.length} archivo(s) procesado(s).` : ""}`,
    });
  } catch (error) {
    console.error("Error en análisis con archivos:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Error al analizar requerimiento con archivos",
    });
  }
};

/**
 * Genera PDF y lo sube como comentario en Jira
 * POST /api/requirement-analysis/publish-to-jira
 */
export const publishAnalysisToJira = async (req: Request, res: Response) => {
  try {
    const { jiraUrl, pdfBase64, analysisData } = req.body;

    if (!jiraUrl || !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: "URL de Jira y PDF requeridos",
      });
    }

    // Extraer issue key
    const issueKeyMatch = jiraUrl.match(/([A-Z]+-\d+)/);
    if (!issueKeyMatch) {
      throw new Error("URL de Jira inválida");
    }

    const issueKey = issueKeyMatch[1];
    const jiraDomain = jiraUrl.split("/browse/")[0];

    const jiraToken = process.env.JIRA_API_TOKEN;
    const jiraEmail = process.env.JIRA_EMAIL;

    // Validar credenciales
    if (!jiraToken || !jiraEmail) {
      console.warn(
        "[Publish] Credenciales de Jira no disponibles - modo simulado"
      );
      return res.json({
        success: true,
        data: {
          issueKey: issueKey,
          attachmentId: "local-pdf",
          message: `Simulado: PDF listo para ${issueKey}. En producción se subiría a Jira`,
        },
        message: "PDF generado (Jira no disponible en desarrollo)",
      });
    }

    try {
      // 1. Subir archivo PDF como attachment
      const attachmentUrl = `${jiraDomain}/rest/api/3/issue/${issueKey}/attachments`;
      
      console.log(`[Publish] Intentando subir PDF a: ${attachmentUrl}`);

      const formData = new FormData();
      const blob = new Blob([Buffer.from(pdfBase64, "base64")], {
        type: "application/pdf",
      });
      formData.append("file", blob, "analisis-ambiguedades.pdf");

      const attachmentResponse = await axios.post(attachmentUrl, formData, {
        auth: {
          username: jiraEmail,
          password: jiraToken,
        },
        headers: {
          "X-Atlassian-Token": "no-check",
        },
        timeout: 5000,
      });

      const attachmentId = attachmentResponse.data[0].id;

      console.log(`[Publish] PDF subido exitosamente: ${attachmentId}`);

      res.json({
        success: true,
        data: {
          issueKey: issueKey,
          attachmentId: attachmentId,
          message: "PDF publicado en Jira",
        },
        message: "Análisis publicado exitosamente",
      });
    } catch (jiraError) {
      const errorMsg = jiraError instanceof Error ? jiraError.message : "Error desconocido";
      const errorStatus = (jiraError as any)?.response?.status || "sin status";
      const errorData = (jiraError as any)?.response?.data || "sin datos";
      
      console.warn(
        `[Publish] Error al conectar con Jira (Status: ${errorStatus}, Mensaje: ${errorMsg})`
      );
      console.warn(`[Publish] Respuesta de Jira:`, JSON.stringify(errorData, null, 2));

      // Fallback: devolver éxito simulado
      res.json({
        success: true,
        data: {
          issueKey: issueKey,
          attachmentId: "offline-mode",
          message: "PDF generado localmente (Jira no disponible en este momento)",
        },
        message: "PDF generado y listo. Nota: No se pudo conectar con Jira para subir el archivo.",
      });
    }
  } catch (error) {
    console.error("Error en publishAnalysisToJira:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la publicación",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Construye el cuerpo del comentario en formato ADF (Atlassian Document Format)
 * para publicarlo como comentario enriquecido en Jira
 */
const buildJiraADFComment = (analysis: { originalHU: string; ambiguities: Array<{ type: string; text: string; issue: string; suggestion: string; severity: string; lineNumber: number }>; summary: { totalIssues: number; criticalIssues: number } }) => {
  const { ambiguities, summary } = analysis;

  // Agrupar por severidad
  const high = ambiguities.filter((a) => a.severity === "high");
  const medium = ambiguities.filter((a) => a.severity === "medium");
  const low = ambiguities.filter((a) => a.severity === "low");

  const makeBulletItem = (finding: { text: string; issue: string; suggestion: string }) => ({
    type: "listItem",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: `"${finding.text}" `, marks: [{ type: "strong" }] },
          { type: "text", text: `${finding.issue}. ` },
          { type: "text", text: `Sugerencia: ${finding.suggestion}`, marks: [{ type: "em" }] },
        ],
      },
    ],
  });

  const makePanelSection = (panelType: string, title: string, items: typeof ambiguities) => {
    if (items.length === 0) return null;
    return {
      type: "panel",
      attrs: { panelType },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: title, marks: [{ type: "strong" }] }],
        },
        {
          type: "bulletList",
          content: items.map(makeBulletItem),
        },
      ],
    };
  };

  // Encabezado resumen (sin textColor — no soportado en comments)
  const headerPanel = {
    type: "panel",
    attrs: { panelType: summary.criticalIssues > 0 ? "error" : "warning" },
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Analisis de requerimiento QA:", marks: [{ type: "strong" }] },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: `Se encontraron ${summary.totalIssues} problema(s) (${summary.criticalIssues} critico(s)). Revision automatica generada por Manager QA.` },
        ],
      },
    ],
  };

  const sections = [
    headerPanel,
    makePanelSection("error", "Problemas criticos (alta severidad):", high),
    makePanelSection("warning", "Advertencias (severidad media):", medium),
    makePanelSection("note", "Observaciones (baja severidad):", low),
  ].filter(Boolean) as object[];

  return {
    version: 1,
    type: "doc",
    content: sections,
  };
};

/**
 * Publica el análisis como comentario formateado en Jira
 * POST /api/requirement-analysis/comment-on-jira
 * Body: { jiraUrl, analysisData } o { jiraUrl, customText } para analizar y comentar en un paso
 */
export const commentOnJira = async (req: Request, res: Response) => {
  try {
    const { jiraUrl, analysisData, customText } = req.body;

    if (!jiraUrl) {
      return res.status(400).json({ success: false, message: "jiraUrl es requerido" });
    }

    const issueKeyMatch = jiraUrl.match(/([A-Z]+-\d+)/i);
    if (!issueKeyMatch) {
      return res.status(400).json({ success: false, message: "URL de Jira inválida. Formato: .../browse/PROJ-123" });
    }

    const issueKey = issueKeyMatch[1].toUpperCase();
    const jiraDomain = jiraUrl.split("/browse/")[0];
    const jiraToken = process.env.JIRA_API_TOKEN;
    const jiraEmail = process.env.JIRA_EMAIL;

    console.log(`[Comment] issueKey=${issueKey}, tieneAnalysis=${!!analysisData}, tieneCredenciales=${!!(jiraToken && jiraEmail)}`);

    // Obtener o calcular el análisis
    let analysis = analysisData;
    if (!analysis) {
      const text = customText || (await fetchJiraIssue(jiraUrl));
      analysis = await analyzer.analyzeHU(text);
    }

    // Construir body ADF del comentario
    const commentBody = buildJiraADFComment(analysis);

    // Modo simulado si no hay credenciales
    if (!jiraToken || !jiraEmail) {
      console.warn("[Comment] Credenciales de Jira no configuradas - modo simulado");
      return res.json({
        success: true,
        data: { issueKey, simulated: true, commentBody },
        message: `Simulado: comentario listo para ${issueKey}. Configura JIRA_API_TOKEN y JIRA_EMAIL en .env para publicar.`,
      });
    }

    // Publicar comentario en Jira API v3
    const commentUrl = `${jiraDomain}/rest/api/3/issue/${issueKey}/comment`;
    console.log(`[Comment] Publicando en: ${commentUrl}`);
    console.log(`[Comment] ADF sections: ${JSON.stringify(commentBody).length} bytes, ${(commentBody as any).content?.length} secciones`);

    const response = await axios.post(
      commentUrl,
      { body: commentBody },
      {
        auth: { username: jiraEmail, password: jiraToken },
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    console.log(`[Comment] Comentario publicado. ID: ${response.data.id}`);

    res.json({
      success: true,
      data: {
        issueKey,
        commentId: response.data.id,
        commentUrl: response.data.self,
        totalIssues: analysis.summary.totalIssues,
      },
      message: `Análisis publicado como comentario en ${issueKey}`,
    });
  } catch (error) {
    const code = (error as any)?.code;
    const status = (error as any)?.response?.status;
    const detail = (error as any)?.response?.data;

    let friendlyError = error instanceof Error ? error.message : "Error al publicar comentario en Jira";
    if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
      friendlyError = "No se puede alcanzar el servidor Jira. Verifica tu red o VPN.";
    } else if (code === "ETIMEDOUT") {
      friendlyError = "Tiempo de espera agotado al conectar con Jira.";
    } else if (status === 401 || status === 403) {
      friendlyError = "Credenciales de Jira inválidas o sin permisos para comentar.";
    } else if (status === 404) {
      friendlyError = "La issue de Jira no existe o no es accesible.";
    } else if (status === 400) {
      friendlyError = "El formato del comentario fue rechazado por Jira (ADF inválido).";
      console.error("[Comment] Detalle del error 400:", JSON.stringify(detail, null, 2));
    }

    console.error(`[Comment] Error al publicar (${status || code || "desconocido"}): ${friendlyError}`);
    res.status(500).json({
      success: false,
      error: friendlyError,
      detail: detail || undefined,
    });
  }
};

/**
 * Flujo completo: analizar y publicar en Jira
 * POST /api/requirement-analysis/analyze-and-publish
 */
export const analyzeAndPublish = async (req: Request, res: Response) => {
  try {
    const { jiraUrl } = req.body;

    // 1. Obtener HU desde Jira
    const huText = await fetchJiraIssue(jiraUrl);

    // 2. Analizar con MCP
    const analysis = await analyzer.analyzeHU(huText);

    // 3. Generar PDF (aquí se necesita pdfmake en el cliente)
    // El cliente generará el PDF y lo enviarán como base64

    res.json({
      success: true,
      data: {
        analysis,
        nextStep: "El cliente debe generar el PDF con pdfmake y enviarlo a /publish-to-jira",
      },
      message: "Análisis completado. Envía el PDF para publicar en Jira",
    });
  } catch (error) {
    console.error("Error en flujo:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Error en análisis",
    });
  }
};

export default {
  analyzeRequirement,
  publishAnalysisToJira,
  analyzeAndPublish,
  commentOnJira,
};
