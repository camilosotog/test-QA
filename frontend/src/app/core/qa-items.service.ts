// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Board {
  id?: number;
  name: string;
  owner_id?: number;
  owner_name?: string;
  test_cases?: number | null;
  developer_id?: number | null;
  developer_name?: string | null;
  state?: 'En pruebas' | 'Bloqueado' | 'Listo' | 'Sin iniciar' | 'Devuelta';
  sprint_id?: number | null;
  sprint_name?: string | null;
  sprint_prev?: string | null;
  returns?: number | null;
  return_date?: string | null;
  automated_cases?: number | null;
  created_at?: string;
  updated_at?: string;
  in_testing_age?: string | null;
  estimate?: number | null;
}

export interface Sprint {
  id?: number;
  name: string;
  start_date?: string | null;
  finish_date?: string | null;
  boards_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SprintWithBoards {
  sprint_id: number;
  sprint_name: string;
  start_date?: string | null;
  finish_date?: string | null;
  boards: Board[];
}

export interface QAStatisticsByMonth {
  qa_name: string;
  qa_id: number;
  mes_prueba: string;
  tareas_probadas: number;
  total_devoluciones: number;
  promedio_devoluciones_por_tarea: number;
}

export interface QAGeneralStatistics {
  qa_name: string;
  qa_id: number;
  total_tareas: number;
  total_devoluciones: number;
  promedio_devoluciones: number;
  tareas_exitosas: number;
  tareas_devueltas: number;
}

export interface DevolutionsByMonth {
  qa_name: string;
  qa_id: number;
  mes_devolucion: string;
  tareas_devueltas: number;
  contador_devoluciones: number;
}

export interface QAStatisticsResponse {
  estadisticasPorMes: QAStatisticsByMonth[];
  estadisticasGenerales: QAGeneralStatistics[];
  devolucionesPorMes: DevolutionsByMonth[];
}

@Injectable({
  providedIn: 'root'
})
export class QaItemsService {
  getBoardsBySprintId(sprintId: number): Observable<Board[]> {
    return this.http.get<Board[]>(`/api/sprints/${sprintId}/boards`);
  }

  constructor(private http: HttpClient) { }

  getItems(): Observable<Board[]> {
    return this.http.get<Board[]>('/api/qa-items');
  }

  getItem(id: number): Observable<Board> {
    return this.http.get<Board>(`/api/qa-items/${id}`);
  }

  createItem(item: Board): Observable<any> {
    return this.http.post('/api/qa-items', item);
  }

  checkDuplicateTask(name: string): Observable<any> {
    return this.http.get(`/api/qa-items/check-duplicate?name=${encodeURIComponent(name)}`);
  }

  updateItem(id: number, item: Partial<Board>): Observable<any> {
    return this.http.put(`/api/qa-items/${id}`, item);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete(`/api/qa-items/${id}`);
  }

  // Métodos para Sprints
  getSprints(): Observable<Sprint[]> {
    return this.http.get<Sprint[]>('/api/sprints');
  }

  getSprint(id: number): Observable<Sprint> {
    return this.http.get<Sprint>(`/api/sprints/${id}`);
  }

  createSprint(sprint: Sprint): Observable<any> {
    return this.http.post('/api/sprints', sprint);
  }

  updateSprint(id: number, sprint: Partial<Sprint>): Observable<any> {
    return this.http.put(`/api/sprints/${id}`, sprint);
  }

  deleteSprint(id: number): Observable<any> {
    return this.http.delete(`/api/sprints/${id}`);
  }

  getBoardsBySprint(): Observable<SprintWithBoards[]> {
    return this.http.get<SprintWithBoards[]>('/api/sprints/boards');
  }

  getQAStatistics(): Observable<QAStatisticsResponse> {
    return this.http.get<QAStatisticsResponse>('/api/qa-items/statistics');
  }
}
