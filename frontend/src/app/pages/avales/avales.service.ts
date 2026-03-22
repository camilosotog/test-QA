import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeployTask {
  jira_key: string;
  description: string;
  notes: string;
}

export interface RequiredInput {
  label: string;
  checked: boolean;
}

export interface Aval {
  id?: number;
  title: string;
  project_name: string;
  request_date: string;
  requester: string;
  responsible_team: string;
  current_env: string;
  target_env: string;
  qa_responsible: string;
  observations: string;
  deploy_tasks: DeployTask[];
  required_inputs: RequiredInput[];
  qa_role: string;
  po_name: string;
  po_role: string;
  created_by?: number;
  confluence_page_id?: string;
  confluence_page_url?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AvalesService {
  private apiUrl = '/api/avales';

  constructor(private http: HttpClient) {}

  list(): Observable<{ success: boolean; data: Aval[] }> {
    return this.http.get<{ success: boolean; data: Aval[] }>(this.apiUrl);
  }

  getById(id: number): Observable<{ success: boolean; data: Aval }> {
    return this.http.get<{ success: boolean; data: Aval }>(`${this.apiUrl}/${id}`);
  }

  create(aval: Aval): Observable<{ success: boolean; data: { id: number }; message: string }> {
    return this.http.post<{ success: boolean; data: { id: number }; message: string }>(this.apiUrl, aval);
  }

  update(id: number, aval: Partial<Aval>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, aval);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  publishToConfluence(id: number): Observable<{ success: boolean; message: string; data: { pageId: string; pageUrl: string } }> {
    return this.http.post<{ success: boolean; message: string; data: { pageId: string; pageUrl: string } }>(
      `${this.apiUrl}/${id}/publish`, {}
    );
  }

  testConfluence(): Observable<{ success: boolean; message?: string; error?: string; hint?: string; data?: { user: string; baseUrl: string; spaces: { key: string; name: string; type: string }[]; configured_space_key: string } }> {
    return this.http.get<any>(`${this.apiUrl}/test-confluence`);
  }

  mejorarObservaciones(payload: Partial<Aval>): Observable<{ success: boolean; data: { improved_text: string } }> {
    return this.http.post<{ success: boolean; data: { improved_text: string } }>(
      `${this.apiUrl}/mejorar`, payload
    );
  }
}
