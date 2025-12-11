import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PostmanExecutionRequest {
  projectName: string; // Nombre del proyecto (ej: YAMAHA, HACEB)
  maxRetries?: number;
  
  // Propiedades legacy (mantenidas para compatibilidad)
  collectionId?: string;
  postmanApiKey?: string;
  environmentId?: string;
  collectionName?: string;
  environmentName?: string;
}

export interface PostmanExecutionResponse {
  message: string;
  project?: string; // Nombre del proyecto utilizado
  resultsCount: number;
  totalExecutions?: number;
  results: PostmanResult[];
  executionTime: string;
  attempts?: number;
}

export interface PostmanResult {
  id: number;
  test_name: string;
  description: string | null;
  status: 'PASS' | 'FAIL' | 'REDIRECT' | 'UNKNOWN';
  http_code: number | null;
  response_time: number | null;
  response_body?: string | null;
  collection_name: string;
  environment_name: string;
  created_at?: string | Date;
}

export interface PostmanResultWithAssertions extends PostmanResult {
  total_assertions: number;
  passed_assertions: number;
  failed_assertions: number;
  assertions: PostmanAssertion[];
}

export interface PostmanAssertion {
  id: number;
  postman_result_id: number;
  assertion_name: string;
  assertion_description: string;
  assertion_status: 'PASS' | 'FAIL';
  error_message: string | null;
  expected_value: string | null;
  actual_value: string | null;
  created_at: string;
}

export interface PostmanTestResponse {
  message: string;
  duration?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostmanService {
  private baseUrl = '/api/postman';  // Ruta relativa para usar con proxy

  constructor(private http: HttpClient) { }

  /**
   * Ejecutar colección de Postman con reintentos automáticos
   */
  executeWithRetry(request: PostmanExecutionRequest): Observable<PostmanExecutionResponse> {
    return this.http.post<PostmanExecutionResponse>(`${this.baseUrl}/test-retry`, request);
  }

  /**
   * Ejecutar colección de Postman (método básico)
   */
  execute(request: PostmanExecutionRequest): Observable<PostmanExecutionResponse> {
    return this.http.post<PostmanExecutionResponse>(`${this.baseUrl}/test-run`, request);
  }

  /**
   * Ejecutar desde URL de Postman
   */
  executeFromUrl(request: PostmanExecutionRequest): Observable<PostmanExecutionResponse> {
    return this.http.post<PostmanExecutionResponse>(`${this.baseUrl}/run-url`, request);
  }

  /**
   * Test de request largo (30 segundos)
   */
  testLongRequest(): Observable<PostmanTestResponse> {
    return this.http.post<PostmanTestResponse>(`${this.baseUrl}/test-long`, {});
  }

  /**
   * Obtener resultados guardados
   */
  getResults(filters?: any): Observable<PostmanResult[]> {
    return this.http.get<PostmanResult[]>(`${this.baseUrl}/results`, { params: filters });
  }

  /**
   * Obtener resultados con assertions detalladas
   */
  getResultsWithAssertions(filters?: any): Observable<PostmanResultWithAssertions[]> {
    return this.http.get<PostmanResultWithAssertions[]>(`${this.baseUrl}/results-with-assertions`, { params: filters });
  }

  /**
   * Método wrapper para compatibilidad con el componente
   */
  async runWithRetry(request: PostmanExecutionRequest): Promise<PostmanExecutionResponse> {
    return this.executeWithRetry(request).toPromise() as Promise<PostmanExecutionResponse>;
  }

  /**
   * Eliminar resultados
   */
  deleteResults(ids: number[]): Observable<any> {
    return this.http.delete(`${this.baseUrl}/results`, { body: { ids } });
  }

  /**
   * Obtener resultados específicos de pruebas de contrato por proyecto
   */
  getContractResults(projectName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contract-results`, { projectName });
  }

  /**
   * Obtener resultados específicos de pruebas de respuesta controlada por proyecto
   */
  getControlledResponseResults(projectName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/controlled-response-results`, { projectName });
  }

  /**
   * Obtener resultados específicos de pruebas de respuesta (otras) por proyecto
   */
  getOtherResponseResults(projectName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/response-results`, { projectName });
  }
}