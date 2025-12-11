import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bug {
  id?: number;
  title: string;
  description?: string;
  type?: string;
  created_at?: string;
  createdAt?: string;
  reporter_id?: number;
  assignee_id?: number;
  status?: string;
  priority?: string;
  severity?: string;
  steps_to_reproduce?: string;
  environment?: string;
  attachments?: any;
  sprint_id?: number;
}

@Injectable({ providedIn: 'root' })
export class BugsService {
  private apiUrl = '/api/bugs';
  constructor(private http: HttpClient) {}

  list(filters?: any): Observable<Bug[]> {
    const q = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.http.get<Bug[]>(this.apiUrl + q);
  }

  get(id: number) { return this.http.get<Bug>(`${this.apiUrl}/${id}`); }
  create(payload: Partial<Bug>) { return this.http.post(this.apiUrl, payload); }
  update(id: number, patch: Partial<Bug>) { return this.http.put(`${this.apiUrl}/${id}`, patch); }
  delete(id: number) { return this.http.delete(`${this.apiUrl}/${id}`); }
}
