import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ============================================
// 📦 MODELOS/INTERFACES
// ============================================

export interface TestStep {
  id?: number;
  order: number;
  description: string;
  expected_result: string;
}

export interface TestProject {
  id?: number;
  name: string;
  description?: string;
  status: 'draft' | 'ready' | 'deprecated';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TestSuite {
  id?: number;
  test_project_id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'deprecated';
  created_at?: string;
  updated_at?: string;
}

export interface TestCase {
  id?: number;
  test_suite_id: number;
  test_project_id: number;
  name: string;
  description?: string;
  test_type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  automation_status: 'manual' | 'automated' | 'semi-automated';
  status: 'draft' | 'ready' | 'deprecated' | 'completed';
  // Plantilla de estructura
  preconditions: string;
  input_data: string;
  steps: TestStep[];
  expected_result: string;
  // Archivos adjuntos
  attachments?: Array<{name: string; url: string; uploadedAt?: string}>;
  // Adicionales
  tags?: string[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Campos de resultado (cuando se carga junto con ejecución)
  result_id?: number;
  result_status?: string;
  result_notes?: string;
  evidence_urls?: string | string[];
  tester_name?: string;
  developer_name?: string;
  qa_tested_by?: string;
}

export interface TestExecution {
  id?: number;
  test_suite_id: number;
  executed_by?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  execution_status?: 'pending' | 'in_progress' | 'completed' | 'aborted';
  total_cases?: number;
  passed_cases?: number;
  failed_cases?: number;
  notes?: string;
  started_at?: string;
  ended_at?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  // Propiedades adicionales desde JOIN
  suite_name?: string;
  executed_by_name?: string;
  execution_name?: string;
  executor_id?: number;
  test_project_id?: number;
  cases?: TestCase[];
}

export interface TestResult {
  id?: number;
  execution_id: number;
  test_case_id: number;
  status: 'pass' | 'fail' | 'skip' | 'blocked' | 'skipped';
  notes?: string;
  evidence_urls?: string[];
  tester_name?: string;
  developer_name?: string;
  qa_tested_by?: string;
  error_message?: string;
  execution_time?: number;
  screenshot_url?: string;
  log_url?: string;
  created_at?: string;
}

export interface ProjectAnalytics {
  total_cases: number;
  total_suites: number;
  automated_cases: number;
  manual_cases: number;
  success_rate: number;
  avg_execution_time: number;
  total_executions: number;
}

// ============================================
// 📋 DTOs (Data Transfer Objects)
// ============================================

export interface ExecuteTestsRequest {
  project_id: number;
  case_ids: number[];
  environment: string;
  executed_by: number;
}

export interface ExecutionResponse {
  execution_id: number;
  message: string;
  timestamp: string;
}

// ============================================
// 🔧 SERVICIO PRINCIPAL
// ============================================

@Injectable({
  providedIn: 'root'
})
export class TestomatService {
  private apiUrl = '/api/testomat';

  // BehaviorSubjects para state reactivo
  currentProject$ = new BehaviorSubject<TestProject | null>(null);
  currentSuite$ = new BehaviorSubject<TestSuite | null>(null);
  currentExecution$ = new BehaviorSubject<TestExecution | null>(null);
  executionResults$ = new BehaviorSubject<TestResult[]>([]);
  analytics$ = new BehaviorSubject<ProjectAnalytics | null>(null);
  testCases$ = new BehaviorSubject<TestCase[]>([]);

  constructor(private http: HttpClient) {}

  // ============================================
  // 📌 PROYECTOS
  // ============================================

  /**
   * Obtiene todos los proyectos de prueba
   */
  getTestProjects(): Observable<TestProject[]> {
    return this.http.get<TestProject[]>(`${this.apiUrl}/projects`);
  }

  /**
   * Obtiene un proyecto específico
   */
  getTestProjectById(projectId: number): Observable<TestProject> {
    return this.http.get<TestProject>(`${this.apiUrl}/projects/${projectId}`);
  }

  /**
   * Crea un nuevo proyecto de prueba
   */
  createTestProject(project: TestProject): Observable<TestProject> {
    return this.http.post<TestProject>(`${this.apiUrl}/projects`, project);
  }

  /**
   * Actualiza un proyecto
   */
  updateTestProject(projectId: number, project: Partial<TestProject>): Observable<TestProject> {
    return this.http.put<TestProject>(`${this.apiUrl}/projects/${projectId}`, project);
  }

  /**
   * Establece el proyecto actual
   */
  setCurrentProject(project: TestProject): void {
    this.currentProject$.next(project);
  }

  // ============================================
  // 🗂️ SUITES DE PRUEBA
  // ============================================

  /**
   * Establece la suite actual
   */
  setCurrentSuite(suite: TestSuite): void {
    this.currentSuite$.next(suite);
  }

  /**
   * Obtiene todas las suites de un proyecto
   */
  getTestSuites(projectId: number): Observable<TestSuite[]> {
    return this.http.get<TestSuite[]>(`${this.apiUrl}/projects/${projectId}/suites`);
  }

  /**
   * Obtiene una suite específica
   */
  getTestSuiteById(suiteId: number): Observable<TestSuite> {
    return this.http.get<TestSuite>(`${this.apiUrl}/suites/${suiteId}`);
  }

  /**
   * Crea una nueva suite
   */
  createTestSuite(projectId: number, suite: TestSuite): Observable<TestSuite> {
    return this.http.post<TestSuite>(`${this.apiUrl}/projects/${projectId}/suites`, suite);
  }

  /**
   * Verifica si ya existe una suite con el mismo nombre en el proyecto
   */
  checkSuiteNameExists(projectId: number, name: string): Observable<{exists: boolean; message: string | null; existingSuite: TestSuite | null}> {
    return this.http.get<{exists: boolean; message: string | null; existingSuite: TestSuite | null}>(
      `${this.apiUrl}/projects/${projectId}/suites/check-name`,
      { params: { name } }
    );
  }

  /**
   * Actualiza una suite
   */
  updateTestSuite(suiteId: number, suite: Partial<TestSuite>): Observable<TestSuite> {
    return this.http.put<TestSuite>(`${this.apiUrl}/suites/${suiteId}`, suite);
  }

  /**
   * Elimina una suite
   */
  deleteTestSuite(suiteId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/suites/${suiteId}`);
  }

  // ============================================
  // 📝 CASOS DE PRUEBA
  // ============================================

  /**
   * Obtiene los casos de una suite
   */
  getTestCases(suiteId: number): Observable<TestCase[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suites/${suiteId}/cases`)
      .pipe(
        map((cases: any[]) => cases.map(c => ({
          ...c,
          steps: this.parseSteps(c.steps)
        })))
      );
  }

  /**
   * Obtiene un caso específico
   */
  getTestCaseById(caseId: number): Observable<TestCase> {
    return this.http.get<any>(`${this.apiUrl}/cases/${caseId}`)
      .pipe(
        map((c: any) => ({
          ...c,
          steps: this.parseSteps(c.steps)
        }))
      );
  }

  /**
   * Parsea el campo steps de manera segura
   */
  private parseSteps(steps: any): TestStep[] {
    if (!steps) return [];
    if (Array.isArray(steps)) return steps;
    if (typeof steps === 'string') {
      try {
        const parsed = JSON.parse(steps);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Error parsing steps:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Parsea el campo attachments de manera segura
   */
  private parseAttachments(attachments: any): Array<{name: string; url: string; uploadedAt?: string}> {
    if (!attachments) return [];
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Error parsing attachments:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Crea un nuevo caso de prueba
   */
  createTestCase(testCase: TestCase): Observable<TestCase> {
    return this.http.post<TestCase>(`${this.apiUrl}/cases`, testCase);
  }

  /**
   * Actualiza un caso de prueba
   */
  updateTestCase(caseId: number, testCase: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.apiUrl}/cases/${caseId}`, testCase);
  }

  /**
   * Elimina un caso de prueba
   */
  deleteTestCase(caseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cases/${caseId}`);
  }

  /**
   * Busca casos de prueba
   */
  searchTestCases(query: string, projectId?: number): Observable<TestCase[]> {
    let params = new HttpParams().set('q', query);
    if (projectId) {
      params = params.set('projectId', projectId.toString());
    }
    return this.http.get<TestCase[]>(`${this.apiUrl}/cases/search`, { params });
  }

  /**
   * Actualiza los casos actualmente cargados
   */
  setTestCases(cases: TestCase[]): void {
    this.testCases$.next(cases);
  }

  // ============================================
  // 🎯 EJECUCIONES DE PRUEBAS
  // ============================================

  /**
   * Obtiene todas las ejecuciones
   */
  getTestExecutions(): Observable<TestExecution[]> {
    return this.http.get<TestExecution[]>(`${this.apiUrl}/executions`);
  }

  /**
   * Obtiene una ejecución específica con sus resultados
   */
  getTestExecutionById(executionId: number): Observable<TestExecution> {
    return this.http.get<any>(`${this.apiUrl}/executions/${executionId}`)
      .pipe(
        map((execution: any) => ({
          ...execution,
          cases: (execution?.cases || []).map((c: any) => ({
            ...c,
            steps: this.parseSteps(c.steps),
            attachments: this.parseAttachments(c.attachments)
          }))
        }))
      );
  }

  /**
   * Crea una nueva ejecución para una suite
   * @param suiteId ID de la suite
   * @param executedByUserId ID del usuario QA que ejecutará (opcional)
   */
  createTestExecution(suiteId: number, executedByUserId?: number): Observable<TestExecution> {
    const body: any = {
      test_suite_id: suiteId
    };
    
    // Si se proporciona el ID del ejecutor, incluirlo
    if (executedByUserId) {
      body.executed_by_id = executedByUserId;
    }
    
    return this.http.post<TestExecution>(`${this.apiUrl}/suites/${suiteId}/executions`, body);
  }

  /**
   * Guarda el resultado de un caso en una ejecución
   */
  saveTestResult(result: any, files?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('test_case_id', result.test_case_id);
    formData.append('execution_id', result.execution_id);
    formData.append('status', result.status);
    if (result.notes) formData.append('notes', result.notes);
    if (result.tester_name) formData.append('tester_name', result.tester_name);
    if (result.developer_name) formData.append('developer_name', result.developer_name);
    if (result.qa_tested_by) formData.append('qa_tested_by', result.qa_tested_by);
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('evidence', file);
      });
    }

    return this.http.post<any>(`${this.apiUrl}/results`, formData);
  }

  /**
   * Obtiene el resultado de un caso específico
   */
  getTestResult(testCaseId: number, executionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/results/${testCaseId}/${executionId}`);
  }

  /**
   * Elimina una evidencia específica de un resultado de prueba
   */
  deleteEvidence(executionId: number, caseId: number, evidenceUrl: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/executions/${executionId}/cases/${caseId}/evidence`, {
      body: { evidenceUrl }
    });
  }

  /**
   * Marca una ejecución como completada
   */
  completeTestExecution(executionId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/executions/${executionId}/complete`, {});
  }

  /**
   * Reabre una ejecución completada (marca como "en progreso")
   */
  reopenTestExecution(executionId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/executions/${executionId}/reopen`, {});
  }

  /**
   * Elimina una ejecución completa con todos sus resultados y evidencias
   */
  deleteTestExecution(executionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/executions/${executionId}`);
  }

  /**
   * 🆕 Actualiza el board asociado a una ejecución con los datos de ejecutor y developer
   */
  updateBoardExecutors(executionId: number, qaId: number, devId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/executions/${executionId}/update-board`, {
      qa_id: qaId,
      dev_id: devId
    });
  }

  /**
   * Establece la ejecución actual
   */
  setCurrentExecution(execution: TestExecution): void {
    this.currentExecution$.next(execution);
  }

  // ============================================
  // ✅ RESULTADOS DE PRUEBAS
  // ============================================

  /**
   * Registra un resultado de prueba
   */
  recordTestResult(result: TestResult): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/results`, result);
  }

  /**
   * Obtiene resultados de una ejecución
   */
  getExecutionResults(executionId: number): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.apiUrl}/executions/${executionId}/results`);
  }

  /**
   * Actualiza los resultados actuales
   */
  setExecutionResults(results: TestResult[]): void {
    this.executionResults$.next(results);
  }

  // ============================================
  // 📊 ANALÍTICA
  // ============================================

  /**
   * Obtiene analítica del proyecto
   */
  getProjectAnalytics(projectId: number): Observable<ProjectAnalytics> {
    return this.http.get<ProjectAnalytics>(`${this.apiUrl}/projects/${projectId}/analytics`);
  }

  /**
   * Actualiza la analítica actual
   */
  setAnalytics(analytics: ProjectAnalytics): void {
    this.analytics$.next(analytics);
  }

  // ============================================
  // 📥 IMPORTACIÓN
  // ============================================

  /**
   * Importa casos desde TestOmat.io
   */
  importFromTestomat(importData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/import/testomat`, importData);
  }

  // ============================================
  // 🔄 ESTADO GLOBAL
  // ============================================

  /**
   * Obtiene usuarios filtrados por rol (QA, DEV, ADMIN)
   */
  getUsersByRole(role: 'QA' | 'DEV' | 'ADMIN'): Observable<Array<{id: number; name: string; email: string; user_role: string}>> {
    return this.http.get<Array<{id: number; name: string; email: string; user_role: string}>>(
      `/api/users/by-role?role=${role}`
    );
  }

  /**
   * 🚀 OPTIMIZACIÓN: Obtiene usuarios de múltiples roles en una sola llamada
   */
  getUsersByRoles(): Observable<{qa: any[], dev: any[], admin: any[]}> {
    return this.http.get<{qa: any[], dev: any[], admin: any[]}>('/api/users/by-roles');
  }

  /**
   * Limpia todo el estado
   */
  clearState(): void {
    this.currentProject$.next(null);
    this.currentExecution$.next(null);
    this.executionResults$.next([]);
    this.analytics$.next(null);
    this.testCases$.next([]);
  }
}



