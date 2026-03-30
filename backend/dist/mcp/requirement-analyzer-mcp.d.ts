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
export declare class RequirementAnalyzer {
    constructor();
    /**
     * Analiza una Historia de Usuario y detecta ambigüedades
     */
    analyzeHU(huText: string): Promise<AnalysisResult>;
    /**
     * Valida la estructura Gherkin (Given/When/Then)
     * Detecta múltiples escenarios y los etiqueta
     */
    private validateGherkinStructure;
    /**
     * Parsea los escenarios Gherkin del texto
     */
    private parseScenarios;
    /**
     * Obtiene las primeras N palabras de un texto
     */
    private getWordsContext;
    /**
     * Obtiene N palabras alrededor de una palabra clave
     */
    private getWordsAroundKeyword;
    /**
     * Detecta ambigüedades iniciales: verbos genéricos y adjetivos vagos
     */
    private detectAmbiguities;
    /**
     * Mejora análisis con Ollama (LLM local) para contexto más profundo
     */
    private enhanceWithOllama;
    /**
     * Genera resumen del análisis
     */
    private generateSummary;
    /**
     * Genera PDF con el análisis (para usar con pdfmake en frontend)
     */
    generatePDFContent(result: AnalysisResult): Record<string, unknown>;
}
export default RequirementAnalyzer;
//# sourceMappingURL=requirement-analyzer-mcp.d.ts.map