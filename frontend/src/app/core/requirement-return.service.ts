import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RequirementReturn {
  id?: number;
  po_name: string;
  task_code: string;
  return_reason: string;
  created_at?: string;
  is_active?: number;
}

export interface RequirementReturnStatistics {
  po_name: string;
  total_returns: number;
  month: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequirementReturnService {
  private baseUrl = '/api/requirement-returns';

  constructor(private http: HttpClient) {}

  list(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`, { params: filters });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  create(data: RequirementReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  update(id: number, patch: Partial<RequirementReturn>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, patch);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getByDateRange(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  getStatisticsByPO(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/by-po`);
  }

  getStatisticsByMonth(year?: number, month?: number): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.http.get<any>(`${this.baseUrl}/statistics/by-month`, { params });
  }
}
