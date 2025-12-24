/**
 * MCP: Requirement Analyzer
 * Analiza Historias de Usuario detectando ambigüedades en verbos y adjetivos
 * Usa Ollama (LLM local) en lugar de APIs externas
 */

interface AmbiguityFinding {
  type: "verb" | "adjective";
  text: string;
  issue: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
  lineNumber: number;
}

interface AnalysisResult {
  originalHU: string;
  ambiguities: AmbiguityFinding[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    suggestions: string[];
  };
  timestamp: string;
}

const AMBIGUOUS_VERBS = [
  "permitir",
  "gestionar",
  "manejar",
  "procesar",
  "optimizar",
  "mejorar",
  "facilitar",
  "soportar",
  "permitir",
];

const AMBIGUOUS_ADJECTIVES = [
  "intuitiva",
  "bonito",
  "fácil",
  "rápido",
  "eficiente",
  "moderno",
  "simple",
  "elegante",
  "amigable",
  "responsive",
];

export class RequirementAnalyzer {
  constructor() {
    // No se necesita inicialización; las variables de entorno se leen en tiempo de ejecución
  }

  /**
   * Analiza una Historia de Usuario y detecta ambigüedades
   */
  async analyzeHU(huText: string): Promise<AnalysisResult> {
    // Análisis local de verbos/adjetivos problemáticos
    const localFindings = this.detectAmbiguities(huText);

    // Análisis con Ollama para contexto y sugerencias mejoradas
    const enhancedFindings = await this.enhanceWithOllama(huText, localFindings);

    const summary = this.generateSummary(enhancedFindings);

    return {
      originalHU: huText,
      ambiguities: enhancedFindings,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detecta ambigüedades iniciales: verbos genéricos y adjetivos vagos
   */
  private detectAmbiguities(huText: string): AmbiguityFinding[] {
    const findings: AmbiguityFinding[] = [];
    const lines = huText.split("\n");

    lines.forEach((line, lineIndex) => {
      // Detectar verbos genéricos
      AMBIGUOUS_VERBS.forEach((verb) => {
        const regex = new RegExp(`\\b${verb}\\b`, "gi");
        const matches = line.matchAll(regex);

        for (const match of matches) {
          findings.push({
            type: "verb",
            text: verb,
            issue: `Verbo genérico y poco claro: "${verb}"`,
            suggestion: `Reemplazar con verbos más específicos: registrar, editar, eliminar (según la acción concreta)`,
            severity: "high",
            lineNumber: lineIndex + 1,
          });
        }
      });

      // Detectar adjetivos vagos
      AMBIGUOUS_ADJECTIVES.forEach((adjective) => {
        const regex = new RegExp(`\\b${adjective}\\b`, "gi");
        const matches = line.matchAll(regex);

        for (const match of matches) {
          findings.push({
            type: "adjective",
            text: adjective,
            issue: `Adjetivo ambiguo: "${adjective}"`,
            suggestion: `Especificar con guías de diseño o criterios medibles: (ej: "completar cualquier acción en menos de 3 clics")`,
            severity: "high",
            lineNumber: lineIndex + 1,
          });
        }
      });
    });

    return findings;
  }

  /**
   * Mejora análisis con Ollama (LLM local) para contexto más profundo
   */
  private async enhanceWithOllama(
    huText: string,
    localFindings: AmbiguityFinding[]
  ): Promise<AmbiguityFinding[]> {
    const prompt = `Eres un analista QA experto en identificar ambigüedades en Historias de Usuario.

Analiza esta Historia de Usuario y sugiere mejoras:

${huText}

Se han detectado inicialmente estas ambigüedades:
${localFindings.map((f) => `- ${f.type}: "${f.text}" (línea ${f.lineNumber})`).join("\n")}

Por favor:
1. Confirma si estas ambigüedades son críticas
2. Identifica cualquier otra ambigüedad no detectada
3. Proporciona sugerencias concretas de cómo aclarar cada punto
4. Sugiere criterios de aceptación específicos

Responde de forma clara y concisa.`;

    try {
      const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
      const ollamaModel = process.env.OLLAMA_MODEL || "llama2-mini";

      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as { response: string };

      // Ollama devuelve { response: "..." }
      // Para este MVP, retornamos los hallazgos locales mejorados
      // En producción, parseríamos la respuesta de Ollama para refinar findings
      console.log("Ollama analysis complete");
      return localFindings;
    } catch (error) {
      console.error("Error en análisis con Ollama:", error);
      // Fallback: retornamos hallazgos locales si Ollama falla
      return localFindings;
    }
  }

  /**
   * Genera resumen del análisis
   */
  private generateSummary(findings: AmbiguityFinding[]) {
    const criticalIssues = findings.filter((f) => f.severity === "high").length;

    const suggestions = [
      ...new Set(findings.map((f) => f.suggestion)),
    ].slice(0, 5);

    return {
      totalIssues: findings.length,
      criticalIssues,
      suggestions,
    };
  }

  /**
   * Genera PDF con el análisis (para usar con pdfmake en frontend)
   */
  generatePDFContent(result: AnalysisResult): Record<string, unknown> {
    const isHighSeverity = (f: AmbiguityFinding) => f.severity === "high";
    const isMediumSeverity = (f: AmbiguityFinding) => f.severity === "medium";

    return {
      content: [
        {
          text: "ANÁLISIS DE AMBIGÜEDADES EN HISTORIA DE USUARIO",
          style: "header",
          margin: [0, 0, 0, 20],
        },
        {
          text: `Fecha: ${new Date(result.timestamp).toLocaleString("es-ES")}`,
          style: "subheader",
          margin: [0, 0, 0, 10],
        },
        {
          text: "HISTORIA DE USUARIO ORIGINAL",
          style: "subheader2",
          margin: [0, 0, 0, 10],
        },
        {
          text: result.originalHU,
          style: "quote",
          margin: [0, 0, 0, 20],
        },
        {
          text: "RESUMEN EJECUTIVO",
          style: "subheader2",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              ["Métrica", "Valor"],
              ["Total de Ambigüedades", result.summary.totalIssues.toString()],
              [
                "Problemas Críticos",
                result.summary.criticalIssues.toString(),
              ],
            ],
          },
          margin: [0, 0, 0, 20],
        },
        {
          text: "AMBIGÜEDADES DETECTADAS - CRÍTICAS",
          style: "subheader2",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["15%", "25%", "30%", "30%"],
            body: [
              ["Tipo", "Texto", "Problema", "Sugerencia"],
              ...result.ambiguities
                .filter(isHighSeverity)
                .map((f) => [f.type, f.text, f.issue, f.suggestion]),
            ],
          },
          margin: [0, 0, 0, 20],
        },
        ...(result.ambiguities.some(isMediumSeverity)
          ? [
              {
                text: "AMBIGÜEDADES DETECTADAS - MEDIA PRIORIDAD",
                style: "subheader2",
                margin: [0, 0, 0, 10],
              },
              {
                table: {
                  headerRows: 1,
                  widths: ["15%", "25%", "30%", "30%"],
                  body: [
                    ["Tipo", "Texto", "Problema", "Sugerencia"],
                    ...result.ambiguities
                      .filter(isMediumSeverity)
                      .map((f) => [f.type, f.text, f.issue, f.suggestion]),
                  ],
                },
                margin: [0, 0, 0, 20],
              },
            ]
          : []),
        {
          text: "RECOMENDACIONES GENERALES",
          style: "subheader2",
          margin: [0, 0, 0, 10],
        },
        {
          ul: result.summary.suggestions.map((s) => ({
            text: s,
          })),
          margin: [0, 0, 0, 20],
        },
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          color: "#FF8C00",
        },
        subheader: {
          fontSize: 12,
          bold: true,
          color: "#333",
        },
        subheader2: {
          fontSize: 11,
          bold: true,
          color: "#FF8C00",
        },
        quote: {
          italics: true,
          color: "#666",
          background: "#f5f5f5",
          padding: [10, 10, 10, 10],
        },
      },
      defaultStyle: {
        font: "Helvetica",
        fontSize: 10,
        alignment: "left",
      },
    };
  }
}

export default RequirementAnalyzer;
