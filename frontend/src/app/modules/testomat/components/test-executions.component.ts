import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TestomatService, TestExecution, TestSuite } from '../services/testomat.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MonthGroup {
  monthNumber: number;
  monthName: string;
  year: number;
  displayName: string;
  isExpanded: boolean;
  executions: TestExecution[];
}

@Component({
  selector: 'app-test-executions',
  templateUrl: './test-executions.component.html',
  styleUrls: ['./test-executions.component.scss']
})
export class TestExecutionsComponent implements OnInit, OnDestroy {
  executions: TestExecution[] = [];
  monthGroups: MonthGroup[] = [];
  currentSuite: TestSuite | null = null;
  loading = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  private monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private testomatService: TestomatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar todas las ejecuciones sin filtrar por suite
    this.loadExecutions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las ejecuciones y las agrupa por mes
   */
  loadExecutions(): void {
    this.loading = true;
    this.error = null;

    this.testomatService.getTestExecutions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (executions) => {
          this.executions = executions;
          this.groupExecutionsByMonth();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar ejecuciones:', err);
          this.error = 'No se pudieron cargar las ejecuciones. Intenta de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Agrupa las ejecuciones por mes y año
   */
  private groupExecutionsByMonth(): void {
    // Crear mapa de grupos por mes
    const groupMap = new Map<string, TestExecution[]>();

    // Agrupar ejecuciones por mes/año
    this.executions.forEach((execution) => {
      // Usar started_at o created_at para determinar el mes
      const dateStr = execution.started_at || execution.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(execution);
    });

    // Convertir a array de MonthGroup y ordenar por fecha descendente
    this.monthGroups = Array.from(groupMap.entries())
      .map(([key, execs]) => {
        const [year, monthStr] = key.split('-');
        const monthNumber = parseInt(monthStr, 10);
        return {
          monthNumber,
          monthName: this.monthNames[monthNumber],
          year: parseInt(year, 10),
          displayName: `${this.monthNames[monthNumber]} ${year}`,
          isExpanded: true, // Por defecto expandido
          executions: execs.sort((a, b) => {
            const dateA = new Date(a.started_at || a.created_at || 0).getTime();
            const dateB = new Date(b.started_at || b.created_at || 0).getTime();
            return dateB - dateA; // Descendente (más reciente primero)
          })
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthNumber - a.monthNumber;
      });
  }

  /**
   * Toggle para expandir/contraer un grupo de mes
   */
  toggleMonthGroup(monthGroup: MonthGroup): void {
    monthGroup.isExpanded = !monthGroup.isExpanded;
  }

  /**
   * Inicia una nueva ejecución
   */
  startNewExecution(): void {
    if (!this.currentSuite?.id) {
      this.error = 'Debes seleccionar una suite primero';
      return;
    }

    this.loading = true;
    this.testomatService.createTestExecution(this.currentSuite.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (execution) => {
          this.router.navigate(['/testomat/ejecucion', execution.id]);
        },
        error: (err) => {
          console.error('❌ Error al crear ejecución:', err);
          this.error = 'No se pudo iniciar la ejecución.';
          this.loading = false;
        }
      });
  }

  /**
   * Abre una ejecución existente
   */
  openExecution(execution: TestExecution): void {
    this.router.navigate(['/testomat/ejecucion', execution.id]);
  }

  /**
   * Continúa una ejecución: la marca como "en progreso" en BD y luego la abre
   */
  continueExecution(execution: TestExecution): void {
    if (!execution?.id) return;

    // Marcar como en progreso en BD
    this.testomatService.reopenTestExecution(execution.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Actualizar el estado local
          execution.status = response.status || 'in_progress';
          (execution as any).execution_status = response.execution_status || 'in_progress';
          // Abrir la ejecución
          this.openExecution(execution);
        },
        error: (err) => {
          console.error('❌ Error al reabrir ejecución:', err);
        }
      });
  }

  /**
   * Obtiene el badge de estado
   * Mapea execution_status y status para mostrar correctamente
   */
  getStatusBadge(execution: TestExecution): string {
    // Si hay al menos un caso fallido, la ejecución falla (independiente del status)
    const hasFailed = (execution.failed_cases ?? 0) > 0;
    if (hasFailed) {
      return 'badge-danger';
    }

    // Si no hay fallos, usar el status normal
    const statusField = (execution as any).status || (execution as any).execution_status || 'pending';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-secondary',
      'in_progress': 'badge-primary',
      'completed': 'badge-success',
      'failed': 'badge-danger',
      'aborted': 'badge-danger'
    };
    return statusMap[statusField] || 'badge-secondary';
  }

  /**
   * Obtiene el texto del estado
   * Si hay fallos, muestra "Fallida" independientemente del status
   */
  getStatusText(execution: TestExecution): string {
    // Si hay al menos un caso fallido, la ejecución es fallida
    const hasFailed = (execution.failed_cases ?? 0) > 0;
    if (hasFailed) {
      return 'Fallida';
    }

    // Si no hay fallos, usar el status normal
    const statusField = (execution as any).status || (execution as any).execution_status || 'pending';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'failed': 'Fallida',
      'aborted': 'Fallida'
    };
    return statusMap[statusField] || statusField;
  }

  /**
   * Calcula el porcentaje de casos pasados
   */
  getProgressPercentage(execution: TestExecution): number {
    const total = execution.total_cases ?? 0;
    const passed = execution.passed_cases ?? 0;
    if (total === 0) return 0;
    return Math.round((passed / total) * 100);
  }
}
