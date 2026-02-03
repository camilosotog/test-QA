import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Return {
  id?: number;
  po_name: string;
  task_code: string;
  return_reason: string;
  created_at?: Date;
  is_active?: number;
}

export interface ReturnStatistics {
  po_name: string;
  total_returns: number;
  month: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReturnService {
  private apiUrl = 'http://localhost:4100/api/returns';

  constructor(private http: HttpClient) { }

  list(filters?: { po_name?: string; task_code?: string }, limit?: number): Observable<any> {
    let params = new HttpParams();
    if (filters?.po_name) params = params.set('po_name', filters.po_name);
    if (filters?.task_code) params = params.set('task_code', filters.task_code);
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}`, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: Return): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, data);
  }

  update(id: number, patch: Partial<Return>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, patch);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getByDateRange(startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<any>(`${this.apiUrl}/date-range`, { params });
  }

  getStatisticsByPO(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics/by-po`);
  }

  getStatisticsByMonth(year?: number, month?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<any>(`${this.apiUrl}/statistics/by-month`, { params });
  }
}
