/**
 * MCP: Requirement Analyzer
 * Analiza Historias de Usuario detectando ambigüedades en verbos y adjetivos
 * Usa Ollama (LLM local) en lugar de APIs externas
 */

interface AmbiguityFinding {
  type: "verb" | "adjective" | "gherkin";
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
  "poder",
  "deber",
  "ser",
  "realizar",
  "efectuar",
  "llevar a cabo",
  "ejecutar",
  "conseguir",
  "obtener",
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
  "automático",
  "transparente",
  "completo",
  "apropiado",
  "correcto",
  "adecuado",
  "suficiente",
  "necesario",
  "importante",
  "relevante",
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
   * Valida la estructura Gherkin (Given/When/Then)
   * Detecta múltiples escenarios y los etiqueta
   */
  private validateGherkinStructure(huText: string): AmbiguityFinding[] {
    const findings: AmbiguityFinding[] = [];
    const lines = huText.split("\n");
    
    // Buscar si hay estructura Gherkin
    const hasGherkin = /\b(dado|given|cuando|when|entonces|then)\b/gi.test(huText);
    
    if (!hasGherkin) {
      return findings; // No hay Gherkin, no validar
    }

    // Detectar escenarios (por "Escenario:", "Scenario:", o simplemente agrupar por bloques Given/When/Then)
    const scenarios = this.parseScenarios(lines);

    scenarios.forEach((scenario, scenarioIndex) => {
      // Usar el nombre del escenario si existe, si no usar número
      let scenarioLabel: string;
      if (scenario.name) {
        // Extraer nombre corto del escenario (ej: "Escenario 1 – Validación exitosa" -> "Esc.1: Validación exitosa")
        const nameMatch = scenario.name.match(/escenario\s*(\d+)\s*[-–:]\s*(.+)/i) || 
                          scenario.name.match(/scenario\s*(\d+)\s*[-–:]\s*(.+)/i);
        if (nameMatch && nameMatch[1] && nameMatch[2]) {
          scenarioLabel = `Esc.${nameMatch[1]}: ${this.getWordsContext(nameMatch[2], 3)}`;
        } else {
          scenarioLabel = this.getWordsContext(scenario.name, 4);
        }
      } else {
        scenarioLabel = scenarios.length > 1 ? `Escenario ${scenarioIndex + 1}` : "Escenario";
      }
      
      // Validar Given
      if (scenario.given.length === 0) {
        findings.push({
          type: "gherkin",
          text: `${scenarioLabel} - DADO: (vacío)`,
          issue: "Sección DADO/GIVEN vacía o ausente",
          suggestion:
            'El DADO debe describir el contexto inicial: "Dado que [precondición del sistema]"',
          severity: "high",
          lineNumber: scenario.startLine,
        });
      } else {
        const givenText = scenario.given.join(" ").toLowerCase();
        const givenPreview = this.getWordsContext(scenario.given.join(" "), 6);
        if (givenText.length < 10) {
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - DADO: ${givenPreview}`,
            issue: "Sección DADO/GIVEN muy corta o vaga",
            suggestion:
              'El DADO debe incluir contexto detallado: "Dado que el usuario está logueado Y tiene permisos de administrador"',
            severity: "medium",
            lineNumber: scenario.startLine,
          });
        }
        // Validar que el GIVEN no sea acción
        const actionVerbs = ["hago", "ingreso", "selecciono", "presiono", "click"];
        const foundActionVerb = actionVerbs.find((v) => givenText.includes(v));
        if (foundActionVerb) {
          const contextWithVerb = this.getWordsAroundKeyword(scenario.given.join(" "), foundActionVerb, 6);
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - DADO: ${contextWithVerb}`,
            issue: "El DADO contiene acciones (debe ser contexto/precondiciones)",
            suggestion:
              'Mover acciones al CUANDO: DADO: precondiciones, CUANDO: acciones del usuario',
            severity: "high",
            lineNumber: scenario.startLine,
          });
        }
      }

      // Validar When
      if (scenario.when.length === 0) {
        findings.push({
          type: "gherkin",
          text: `${scenarioLabel} - CUANDO: (vacío)`,
          issue: "Sección CUANDO/WHEN vacía o ausente",
          suggestion:
            'El CUANDO debe describir la acción del usuario: "Cuando [acción específica]"',
          severity: "high",
          lineNumber: scenario.startLine,
        });
      } else {
        const whenText = scenario.when.join(" ").toLowerCase();
        const whenPreview = this.getWordsContext(scenario.when.join(" "), 6);
        if (whenText.length < 10) {
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - CUANDO: ${whenPreview}`,
            issue: "Sección CUANDO/WHEN muy corta o vaga",
            suggestion:
              'El CUANDO debe describir acciones claras: "Cuando presiono el botón guardar AND completo el formulario"',
            severity: "medium",
            lineNumber: scenario.startLine,
          });
        }
        // Validar que el WHEN tenga verbos de acción (usuario o sistema)
        const actionVerbs = [
          // Acciones de usuario
          "hago", "ingreso", "ingresa", "selecciono", "selecciona",
          "presiono", "presiona", "click", "navego", "navega",
          "completo", "completa", "confirmo", "confirma", "cancelo", "cancela",
          "abro", "abre", "cierro", "cierra", "envío", "envía", "envio", "envia",
          // Acciones de sistema / API
          "consuma", "consume", "valide", "valida", "ejecuta", "ejecute",
          "procesa", "procese", "genera", "genere", "verifica", "verifique",
          "consulta", "consulte", "actualiza", "actualice", "guarda", "guarde",
          "retorna", "retorne", "recibe", "reciba", "obtiene", "obtenga",
          "envía", "envíe", "realiza", "realice", "conecta", "conecte",
        ];
        if (!actionVerbs.some((v) => whenText.includes(v))) {
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - CUANDO: ${whenPreview}`,
            issue: "El CUANDO no describe una acción clara (de usuario o sistema)",
            suggestion:
              'Debe contener verbo de acción: "Cuando el sistema ejecuta...", "Cuando presiono...", "Cuando el usuario selecciona..."',
            severity: "medium",
            lineNumber: scenario.startLine,
          });
        }
      }

      // Validar Then
      if (scenario.then.length === 0) {
        findings.push({
          type: "gherkin",
          text: `${scenarioLabel} - ENTONCES: (vacío)`,
          issue: "Sección ENTONCES/THEN vacía o ausente",
          suggestion:
            'El ENTONCES debe describir el resultado esperado: "Entonces [verificación/resultado observable]"',
          severity: "high",
          lineNumber: scenario.startLine,
        });
      } else {
        const thenText = scenario.then.join(" ").toLowerCase();
        const thenPreview = this.getWordsContext(scenario.then.join(" "), 6);
        if (thenText.length < 10) {
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - ENTONCES: ${thenPreview}`,
            issue: "Sección ENTONCES/THEN muy corta o vaga",
            suggestion:
              'El ENTONCES debe detallar verificaciones: "Entonces veo el mensaje de éxito Y el registro se guarda en BD"',
            severity: "medium",
            lineNumber: scenario.startLine,
          });
        }
        // Validar que el THEN no contenga acciones
        const actionVerbs = ["presiono", "hago", "ingreso", "selecciono", "click", "navego"];
        const foundActionVerb = actionVerbs.find((v) => thenText.includes(v));
        if (foundActionVerb) {
          const contextWithVerb = this.getWordsAroundKeyword(scenario.then.join(" "), foundActionVerb, 6);
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - ENTONCES: ${contextWithVerb}`,
            issue: "El ENTONCES contiene acciones (debe ser verificación del resultado)",
            suggestion:
              'El ENTONCES debe verificar estado/resultados, no ejecutar acciones: "Entonces veo...", "Entonces se guarda..."',
            severity: "high",
            lineNumber: scenario.startLine,
          });
        }
        // Validar que el THEN tenga verificaciones observables
        const verifyKeywords = [
          "veo", "aparece", "muestra", "devuelve", "recibe",
          "contiene", "existe", "se guarda", "mensaje",
        ];
        if (!verifyKeywords.some((v) => thenText.includes(v))) {
          findings.push({
            type: "gherkin",
            text: `${scenarioLabel} - ENTONCES: ${thenPreview}`,
            issue: "El ENTONCES no tiene verificaciones observables claras",
            suggestion:
              'Debe describir qué se ve/verifica: "Entonces veo el mensaje...", "Entonces aparece...", "Entonces se guarda en..."',
            severity: "medium",
            lineNumber: scenario.startLine,
          });
        }
      }
    });

    return findings;
  }

  /**
   * Parsea los escenarios Gherkin del texto
   */
  private parseScenarios(lines: string[]): Array<{
    given: string[];
    when: string[];
    then: string[];
    startLine: number;
    name?: string;
  }> {
    const scenarios: Array<{
      given: string[];
      when: string[];
      then: string[];
      startLine: number;
      name?: string;
    }> = [];

    let currentScenario: { given: string[]; when: string[]; then: string[]; startLine: number; name?: string } | null = null;
    let currentKeyword: "given" | "when" | "then" | null = null;

    lines.forEach((line, lineIndex) => {
      // Normalizar línea: eliminar prefijos de lista/markdown de Confluence/Jira
      const normalizedLine = line
        .trim()
        .replace(/^\s*[-*•]\s+/, '')         // bullet: - item, * item, • item
        .replace(/^\s*\d+[\.)\-]\s+/, '')    // numerado: 1. item, 1) item
        .replace(/^#+\s*/, '')               // heading markdown: ## Texto
        .replace(/\*\*/g, '')               // bold markdown: **texto**
        .replace(/^_{1,2}|_{1,2}$/g, '')    // underscore bold/italic
        .trim();
      const lowerLine = normalizedLine.toLowerCase();
      const trimmedLine = normalizedLine;

      // Detectar inicio de escenario
      if (lowerLine.startsWith("escenario:") || lowerLine.startsWith("scenario:") ||
          lowerLine.startsWith("escenario ") || lowerLine.startsWith("scenario ")) {
        // Guardar escenario anterior si existe
        if (currentScenario) {
          scenarios.push(currentScenario);
        }
        currentScenario = { given: [], when: [], then: [], startLine: lineIndex + 1, name: trimmedLine };
        currentKeyword = null;
      }
      // Detectar palabras clave Gherkin
      else if (lowerLine.startsWith("dado que") || lowerLine.startsWith("dado ") || lowerLine.startsWith("given")) {
        if (!currentScenario) {
          currentScenario = { given: [], when: [], then: [], startLine: lineIndex + 1 };
        }
        currentKeyword = "given";
        const content = trimmedLine.replace(/^(dado que|dado|given)\s*/i, "").trim();
        if (content) currentScenario.given.push(content);
      } else if (lowerLine.startsWith("cuando") || lowerLine.startsWith("when")) {
        if (!currentScenario) {
          currentScenario = { given: [], when: [], then: [], startLine: lineIndex + 1 };
        }
        currentKeyword = "when";
        const content = trimmedLine.replace(/^(cuando|when)\s*/i, "").trim();
        if (content) currentScenario.when.push(content);
      } else if (lowerLine.startsWith("entonces") || lowerLine.startsWith("then")) {
        if (!currentScenario) {
          currentScenario = { given: [], when: [], then: [], startLine: lineIndex + 1 };
        }
        currentKeyword = "then";
        const content = trimmedLine.replace(/^(entonces|then)\s*/i, "").trim();
        if (content) currentScenario.then.push(content);
      } else if (lowerLine.startsWith("y ") || lowerLine.startsWith("and ") || 
                 lowerLine.startsWith("e ") || lowerLine.startsWith("pero ") || lowerLine.startsWith("but ")) {
        if (currentScenario && currentKeyword) {
          const content = trimmedLine.replace(/^(y|and|e|pero|but)\s*/i, "").trim();
          if (content) currentScenario[currentKeyword].push(content);
        }
      }
    });

    // Agregar último escenario
    if (currentScenario) {
      scenarios.push(currentScenario);
    }

    return scenarios;
  }

  /**
   * Obtiene las primeras N palabras de un texto
   */
  private getWordsContext(text: string, wordCount: number): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text.trim();
    return words.slice(0, wordCount).join(" ") + "...";
  }

  /**
   * Obtiene N palabras alrededor de una palabra clave
   */
  private getWordsAroundKeyword(text: string, keyword: string, totalWords: number): string {
    const words = text.trim().split(/\s+/);
    const keywordIndex = words.findIndex(w => w.toLowerCase().includes(keyword.toLowerCase()));
    
    if (keywordIndex === -1) return this.getWordsContext(text, totalWords);
    
    const halfWords = Math.floor(totalWords / 2);
    const start = Math.max(0, keywordIndex - halfWords);
    const end = Math.min(words.length, keywordIndex + halfWords + 1);
    
    let result = words.slice(start, end).join(" ");
    if (start > 0) result = "..." + result;
    if (end < words.length) result = result + "...";
    
    return result;
  }

  /**
   * Detecta ambigüedades iniciales: verbos genéricos y adjetivos vagos
   */
  private detectAmbiguities(huText: string): AmbiguityFinding[] {
    const findings: AmbiguityFinding[] = [];
    
    // Primero validar estructura Gherkin si existe
    const gherkinFindings = this.validateGherkinStructure(huText);
    findings.push(...gherkinFindings);
    
    const lines = huText.split("\n");

    lines.forEach((line, lineIndex) => {
      // Detectar verbos genéricos
      AMBIGUOUS_VERBS.forEach((verb) => {
        const regex = new RegExp(`\\b${verb}\\b`, "gi");
        const matches = line.matchAll(regex);

        for (const match of matches) {
          const contextText = this.getWordsAroundKeyword(line, verb, 6);
          findings.push({
            type: "verb",
            text: contextText,
            issue: `Verbo genérico y poco claro: "${verb}"`,
            suggestion: `Reemplazar con verbos más específicos: registrar, editar, eliminar, crear, visualizar (según la acción concreta)`,
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
          const contextText = this.getWordsAroundKeyword(line, adjective, 6);
          findings.push({
            type: "adjective",
            text: contextText,
            issue: `Adjetivo ambiguo: "${adjective}"`,
            suggestion: `Especificar con guías de diseño o criterios medibles: (ej: "completar cualquier acción en menos de 3 clics")`,
            severity: "high",
            lineNumber: lineIndex + 1,
          });
        }
      });

      // Detectar falta de criterios de aceptación
      if (!line.toLowerCase().includes("cuando") && 
          !line.toLowerCase().includes("entonces") &&
          !line.toLowerCase().includes("dado") &&
          line.toLowerCase().startsWith("como")) {
        findings.push({
          type: "verb",
          text: "sin criterios de aceptación",
          issue: "Falta de criterios de aceptación explícitos",
          suggestion: `Agregar criterios usando formato Gherkin: "Dado que [contexto], cuando [acción], entonces [resultado esperado]"`,
          severity: "high",
          lineNumber: lineIndex + 1,
        });
      }

      // Detectar palabras vagas sin métricas
      const vaguePatterns = [
        { pattern: /rápidamente|rápido/gi, suggestion: "Especificar tiempo máximo (ej: 'en menos de 2 segundos')" },
        { pattern: /fácilmente|fácil/gi, suggestion: "Especificar métrica (ej: 'en 3 clics o menos')" },
        { pattern: /muchos?|varios/gi, suggestion: "Especificar cantidad exacta o rango (ej: '5 o más')" },
        { pattern: /máximo|mínimo|suficiente/gi, suggestion: "Especificar valor numérico exacto" },
      ];

      vaguePatterns.forEach(({ pattern, suggestion }) => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const contextText = this.getWordsAroundKeyword(line, match[0], 6);
          if (!findings.some(f => f.lineNumber === lineIndex + 1 && f.issue.includes(match[0]))) {
            findings.push({
              type: "adjective",
              text: contextText,
              issue: `Término vago sin especificación: "${match[0]}"`,
              suggestion: suggestion,
              severity: "medium",
              lineNumber: lineIndex + 1,
            });
          }
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
      console.log("[Ollama] Análisis completado exitosamente");
      return localFindings;
    } catch (error) {
      console.warn(
        "[Ollama] No disponible - usando análisis local. Ejecuta: ollama run llama2-mini"
      );
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
