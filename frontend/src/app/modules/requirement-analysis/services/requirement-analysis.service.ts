import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface AmbiguityFinding {
  type: "verb" | "adjective";
  text: string;
  issue: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
  lineNumber: number;
}

export interface AnalysisSummary {
  totalIssues: number;
  criticalIssues: number;
  suggestions: string[];
}

export interface AnalysisResult {
  originalHU: string;
  ambiguities: AmbiguityFinding[];
  summary: AnalysisSummary;
  timestamp: string;
}

@Injectable({
  providedIn: "root",
})
export class RequirementAnalysisService {
  private apiUrl = "/api/requirement-analysis";

  constructor(private http: HttpClient) {}

  /**
   * Analiza una Historia de Usuario desde URL de Jira
   */
  analyzeRequirement(jiraUrl: string): Observable<{
    success: boolean;
    data: {
      analysis: AnalysisResult;
      pdfContent: Record<string, unknown>;
    };
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        analysis: AnalysisResult;
        pdfContent: Record<string, unknown>;
      };
      message: string;
    }>(`${this.apiUrl}/analyze`, { jiraUrl });
  }

  /**
   * Publica el análisis como PDF en Jira
   */
  publishAnalysisToJira(
    jiraUrl: string,
    pdfBase64: string,
    analysisData: AnalysisResult
  ): Observable<{
    success: boolean;
    data: {
      issueKey: string;
      attachmentId: string;
      message: string;
    };
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        issueKey: string;
        attachmentId: string;
        message: string;
      };
    }>(`${this.apiUrl}/publish-to-jira`, {
      jiraUrl,
      pdfBase64,
      analysisData,
    });
  }
}
