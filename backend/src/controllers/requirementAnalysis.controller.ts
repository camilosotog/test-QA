import { Request, Response } from "express";
import RequirementAnalyzer from "../mcp/requirement-analyzer-mcp";
import axios from "axios";

const analyzer = new RequirementAnalyzer();

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
    console.error("Error obteniendo issue de Jira:", error);
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
          return res.status(400).json({
            success: false,
            message: "No se pudo obtener issue de Jira. Proporciona 'customText' como alternativa.",
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
};
