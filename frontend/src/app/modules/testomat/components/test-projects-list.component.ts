import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TestomatService, TestProject } from '../services/testomat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-test-projects-list',
  templateUrl: './test-projects-list.component.html',
  styleUrls: ['./test-projects-list.component.scss']
})
export class TestProjectsListComponent implements OnInit, OnDestroy {
  projects: TestProject[] = [];
  projectSuiteCounts: { [key: number]: number } = {};
  loading = false;
  error: string | null = null;
  showForm = false;
  editingProjectId: number | null = null;

  projectForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private testomatService: TestomatService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: ['draft', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de proyectos desde el backend
   */
  loadProjects(): void {
    this.loading = true;
    this.error = null;

    this.testomatService.getTestProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // 🚀 OPTIMIZACIÓN: Manejar tanto formato nuevo (con paginación) como el anterior
          if (response && response.projects) {
            // Formato nuevo con paginación
            this.projects = response.projects;
          } else if (Array.isArray(response)) {
            // Formato anterior (compatibilidad)
            this.projects = response;
          } else {
            this.projects = [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar proyectos:', err);
          this.error = 'No se pudieron cargar los proyectos. Intenta de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Obtiene el total de suites para un proyecto
   */
  getSuiteCount(projectId: number | undefined): number {
    if (!projectId) return 0;
    // 🚀 OPTIMIZACIÓN: Usar suite_count directamente del backend
    const project = this.projects.find(p => p.id === projectId);
    return (project as any)?.suite_count || 0;
  }

  /**
   * Abre el formulario para crear un nuevo proyecto
   */
  openCreateForm(): void {
    this.showForm = true;
    this.editingProjectId = null;
    this.projectForm.reset({ status: 'draft' });
  }

  /**
   * Abre el formulario para editar un proyecto
   */
  openEditForm(project: TestProject): void {
    this.showForm = true;
    this.editingProjectId = project.id || null;
    this.projectForm.patchValue(project);
  }

  /**
   * Cierra el formulario
   */
  closeForm(): void {
    this.showForm = false;
    this.projectForm.reset({ status: 'draft' });
  }

  /**
   * Guarda un nuevo proyecto o actualiza uno existente
   */
  saveProject(): void {
    if (this.projectForm.invalid) {
      return;
    }

    const projectData = this.projectForm.value as TestProject;

    if (this.editingProjectId) {
      // Actualizar proyecto existente
      this.testomatService.updateTestProject(this.editingProjectId, projectData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            const index = this.projects.findIndex(p => p.id === this.editingProjectId);
            if (index > -1) {
              this.projects[index] = updated;
            }
            this.closeForm();
          },
          error: (err) => {
            console.error('Error al actualizar proyecto:', err);
            this.error = 'No se pudo actualizar el proyecto.';
          }
        });
    } else {
      // Crear nuevo proyecto
      this.testomatService.createTestProject(projectData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newProject) => {
            this.projects.push(newProject);
            this.closeForm();
          },
          error: (err) => {
            console.error('Error al crear proyecto:', err);
            this.error = 'No se pudo crear el proyecto.';
          }
        });
    }
  }

  /**
   * Selecciona un proyecto como actual
   */
  selectProject(project: TestProject): void {
    this.testomatService.setCurrentProject(project);
  }

  /**
   * Navega a suites del proyecto
   */
  goToSuites(project: TestProject): void {
    this.selectProject(project);
    this.router.navigate(['/testomat/suites']);
  }

  /**
   * Obtiene el estado visual del proyecto
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'badge-warning',
      'ready': 'badge-success',
      'deprecated': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  /**
   * Obtiene el texto del estado en español
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Borrador',
      'ready': 'Listo',
      'deprecated': 'Deprecado'
    };
    return statusMap[status] || status;
  }
}
