import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlaySummary { total: number; passed: number; failed: number; skipped: number; pass_rate: number; avg_duration_ms: number; }
export interface PlayDaily { day: string; passed: number; failed: number; skipped: number; total: number; }
export interface PlayFailure { test_name: string; runs: number; failures: number; }
export interface PlayResult { id: number; suite: string; test_name: string; status: string; duration_ms: number; run_date: string; }

export interface ProjectInfo {
  id: string;
  name: string;
  testSuites: number;
  passed: number;
  failed: number;
  lastExecution: Date;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PlaywrightService {
  private base = '/api/playwright';
  constructor(private http: HttpClient) {}

  // Obtener proyectos disponibles dinámicamente
  getAvailableProjects(): Observable<ProjectInfo[]> {
    return this.http.get<ProjectInfo[]>(`${this.base}/projects`);
  }

  getSummary(suite?: string): Observable<PlaySummary> { 
    const params = suite ? `?suite=${suite}` : '';
    return this.http.get<PlaySummary>(`${this.base}/summary${params}`); 
  }
  
  getDaily(days = 30, suite?: string): Observable<PlayDaily[]> { 
    const params = suite ? `?days=${days}&suite=${suite}` : `?days=${days}`;
    return this.http.get<PlayDaily[]>(`${this.base}/daily${params}`); 
  }
  
  getTopFailures(limit = 10, suite?: string): Observable<PlayFailure[]> { 
    const params = suite ? `?limit=${limit}&suite=${suite}` : `?limit=${limit}`;
    return this.http.get<PlayFailure[]>(`${this.base}/top-failures${params}`); 
  }
  
  getResults(limit = 200, suite?: string) { 
    const params = suite ? `?limit=${limit}&suite=${suite}` : `?limit=${limit}`;
    return this.http.get<PlayResult[]>(`${this.base}/results${params}`); 
  }

  // Endpoints filtrados por suite
  getContractResults(suite: string): Observable<{ results: PlayResult[] }> {
    return this.http.post<{ results: PlayResult[] }>(`${this.base}/contract-results`, { suite });
  }

  getControlledResponseResults(suite: string): Observable<{ results: PlayResult[] }> {
    return this.http.post<{ results: PlayResult[] }>(`${this.base}/controlled-response-results`, { suite });
  }

  getResponseResults(suite: string): Observable<{ results: PlayResult[] }> {
    return this.http.post<{ results: PlayResult[] }>(`${this.base}/response-results`, { suite });
  }
}
