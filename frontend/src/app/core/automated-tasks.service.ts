import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AutomatedTask {
  id?: number;
  task_name: string;
  state: string;
  created_at?: string;
  qa?: string;
}

@Injectable({ providedIn: 'root' })
export class AutomatedTasksService {
  private apiUrl = '/api/automated-tasks';

  constructor(private http: HttpClient) {}

  getAll(): Observable<AutomatedTask[]> {
    return this.http.get<AutomatedTask[]>(this.apiUrl);
  }

  create(task: { task_name: string; state: string; qa: string }): Observable<AutomatedTask> {
    return this.http.post<AutomatedTask>(this.apiUrl, {
      task_name: task.task_name,
      state: task.state,
      qa: task.qa
    });
  }

  update(task: AutomatedTask): Observable<AutomatedTask> {
    return this.http.put<AutomatedTask>(`${this.apiUrl}/${task.id}`, task);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
