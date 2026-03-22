import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RequirementAnalysisService, AnalysisResult } from "../services/requirement-analysis.service";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

@Component({
  selector: "app-requirement-analysis",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <h1 class="mb-4">
        <i class="bi bi-search"></i> Análisis de Requerimientos MCP
      </h1>

      <!-- Card de Entrada -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-warning text-dark">
          <h5 class="mb-0">
            <i class="bi bi-link-45deg"></i> Refinar Historia de Usuario
          </h5>
        </div>
        <div class="card-body">
          <div class="input-group">
            <span class="input-group-text">
              <i class="bi bi-globe"></i>
            </span>
            <input
              type="text"
              class="form-control form-control-lg"
              placeholder="Ej: https://jira.empresa.com/browse/PROJ-123"
              [(ngModel)]="jiraUrl"
              (keyup.enter)="analyzeRequirement()"
            />
            <button
              class="btn btn-warning"
              (click)="analyzeRequirement()"
              [disabled]="isLoading || !jiraUrl"
            >
              <i class="bi bi-lightning-fill"></i>
              {{ isLoading ? "Analizando..." : "Analizar" }}
            </button>
          </div>
          <small class="text-muted mt-2 d-block">
            Ingresa la URL completa de la tarea de Jira para iniciar el análisis
          </small>
        </div>
      </div>

      <!-- Resultados del Análisis -->
      <div *ngIf="analysisResult" class="row">
        <!-- Resumen -->
        <div class="col-md-4 mb-4">
          <div class="card border-danger h-100">
            <div class="card-header bg-danger text-white">
              <h6 class="mb-0">
                <i class="bi bi-exclamation-triangle"></i> Resumen
              </h6>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-3">
                <span>Total Ambigüedades:</span>
                <strong class="badge bg-danger">
                  {{ analysisResult.summary.totalIssues }}
                </strong>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span>Problemas Críticos:</span>
                <strong class="badge bg-dark">
                  {{ analysisResult.summary.criticalIssues }}
                </strong>
              </div>

              <hr />

              <h6 class="mt-3 mb-2">Recomendaciones:</h6>
              <ul class="small">
                <li *ngFor="let sug of analysisResult.summary.suggestions">
                  {{ sug }}
                </li>
              </ul>

              <div class="d-grid gap-2 mt-4">
                <button
                  class="btn btn-primary"
                  (click)="generateAndPublishPDF()"
                  [disabled]="isPublishing"
                >
                  <i class="bi bi-cloud-upload"></i>
                  {{ isPublishing ? "Publicando..." : "Publicar PDF en Jira" }}
                </button>
              </div>

              <!-- Indicador permanente de comentario publicado -->
              <div *ngIf="commentPostedKey" class="mt-3 p-2 rounded border border-success bg-success bg-opacity-10 small text-success">
                <i class="bi bi-chat-quote-fill me-1"></i>
                Comentario publicado automaticamente en <strong>{{ commentPostedKey }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Hallazgos Críticos -->
        <div class="col-md-8 mb-4">
          <div class="card">
            <div class="card-header bg-info text-white">
              <h6 class="mb-0">
                <i class="bi bi-list-check"></i> Hallazgos Críticos
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Tipo</th>
                      <th>Texto</th>
                      <th>Problema</th>
                      <th>Sugerencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="
                        let finding of analysisResult.ambiguities
                          | slice : 0 : 5
                      "
                      class="align-middle"
                    >
                      <td>
                        <span
                          class="badge"
                          [ngClass]="{
                            'bg-warning text-dark': finding.type === 'verb',
                            'bg-danger': finding.type === 'adjective'
                          }"
                        >
                          {{ finding.type === "verb" ? "V" : "A" }}
                        </span>
                      </td>
                      <td>
                        <code>{{ finding.text }}</code>
                      </td>
                      <td class="small">{{ finding.issue }}</td>
                      <td class="small text-success">
                        {{ finding.suggestion.substring(0, 50) }}...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <small class="text-muted" *ngIf="analysisResult.ambiguities.length > 5">
                Mostrando 5 de {{ analysisResult.ambiguities.length }} hallazgos
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notificación -->
      <div
        *ngIf="toastMessage"
        class="position-fixed bottom-0 end-0 p-3"
        style="z-index: 11"
      >
        <div
          class="toast show"
          [ngClass]="'bg-' + toastType"
          role="alert"
        >
          <div class="toast-body" [ngClass]="{ 'text-white': toastType !== 'light' }">
            <i class="bi" [ngClass]="getToastIcon()"></i>
            {{ toastMessage }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .table-responsive {
        max-height: 400px;
        overflow-y: auto;
      }

      code {
        background: #f8f9fa;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
      }

      .badge {
        font-size: 0.8em;
        padding: 0.35em 0.65em;
      }

      h1 {
        color: #ff8c00;
        font-weight: 600;
      }

      .card-header {
        border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class RequirementAnalysisComponent implements OnInit {
  jiraUrl: string = "";
  analysisResult: AnalysisResult | null = null;
  isLoading: boolean = false;
  isPublishing: boolean = false;
  toastMessage: string = "";
  toastType: string = "";
  commentPostedKey: string = "";   // issueKey del último comentario publicado
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private service: RequirementAnalysisService) {}

  ngOnInit(): void {
    // Inicializar componente
  }

  analyzeRequirement(): void {
    if (!this.jiraUrl.trim()) {
      this.showToast("Ingresa una URL de Jira válida", "warning");
      return;
    }

    this.isLoading = true;
    this.service.analyzeRequirement(this.jiraUrl).subscribe({
      next: (response) => {
        this.analysisResult = response.data.analysis;
        this.isLoading = false;
        this.showToast(
          `✓ Análisis completado: ${response.data.analysis.ambiguities.length} ambigüedades detectadas`,
          "success"
        );

        // Publicar comentario en Jira automáticamente (en segundo plano)
        this.service.commentOnJira(this.jiraUrl, this.analysisResult!).subscribe({
          next: (commentResponse) => {
            if (!commentResponse.data.simulated) {
              this.commentPostedKey = commentResponse.data.issueKey;
              this.showToast(
                `✓ Comentario publicado en Jira: ${commentResponse.data.issueKey}`,
                "success"
              );
            }
          },
          error: (err) => {
            const msg = err.error?.message || err.error?.error || "No se pudo publicar el comentario en Jira";
            console.warn("[Jira Comment]", err);
            this.showToast(`⚠ ${msg}`, "warning");
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.isLoading = false;
        this.showToast(
          error.error?.message || error.error?.error || "Error al analizar la HU",
          "danger"
        );
      },
    });
  }

  generateAndPublishPDF(): void {
    if (!this.analysisResult) return;

    this.isPublishing = true;

    try {
      // Generar PDF con pdfMake
      const pdfDocDefinition = this.generatePDFContent(this.analysisResult);

      pdfMake.createPdf(pdfDocDefinition).getBase64((base64: string) => {
        // Publicar PDF a Jira
        this.service
          .publishAnalysisToJira(this.jiraUrl, base64, this.analysisResult!)
          .subscribe({
            next: (response) => {
              this.isPublishing = false;
              this.showToast(
                `✓ PDF publicado en Jira: ${response.data.issueKey}`,
                "success"
              );

              // Descargar copia local
              this.downloadPDF(
                pdfMake.createPdf(pdfDocDefinition),
                `analisis-${response.data.issueKey}.pdf`
              );

              // También publicar como comentario en Jira
              this.service
                .commentOnJira(this.jiraUrl, this.analysisResult!)
                .subscribe({
                  next: (commentResponse) => {
                    if (!commentResponse.data.simulated) {
                      this.showToast(
                        `✓ Comentario publicado en ${response.data.issueKey}`,
                        "success"
                      );
                    }
                  },
                  error: (err) => {
                    const msg = err.error?.error || "No se pudo publicar el comentario en Jira";
                    console.warn("[Jira Comment]", msg);
                    this.showToast(`⚠ ${msg}`, "warning");
                  },
                });
            },
            error: (error) => {
              this.isPublishing = false;
              this.showToast(
                error.error?.error || "Error al publicar en Jira",
                "danger"
              );
            },
          });
      });
    } catch (error) {
      this.isPublishing = false;
      this.showToast("Error generando PDF", "danger");
    }
  }

  private generatePDFContent(result: AnalysisResult): Record<string, unknown> {
    const isHighSeverity = (f: { severity: string }) => f.severity === "high";
    const isMediumSeverity = (f: { severity: string }) => f.severity === "medium";

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
                .slice(0, 10)
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
                      .slice(0, 10)
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
          ul: result.summary.suggestions.map((s) => ({ text: s })),
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
        fontSize: 10,
        alignment: "left",
      },
    };
  }

  private downloadPDF(pdf: any, filename: string): void {
    pdf.download(filename);
  }

  private showToast(message: string, type: string = "info"): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => {
      this.toastMessage = "";
      this.toastTimer = null;
    }, 5000);
  }

  getToastIcon(): string {
    const icons: { [key: string]: string } = {
      success: "bi-check-circle",
      danger: "bi-exclamation-circle",
      warning: "bi-exclamation-triangle",
      info: "bi-info-circle",
    };
    return icons[this.toastType] || "bi-info-circle";
  }
}
