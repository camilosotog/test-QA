import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TestomatService, TestProject, TestSuite } from '../services/testomat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-test-suites',
  templateUrl: './test-suites.component.html',
  styleUrls: ['./test-suites.component.scss']
})
export class TestSuitesComponent implements OnInit, OnDestroy {
  currentProject: TestProject | null = null;
  suites: TestSuite[] = [];
  loading = false;
  error: string | null = null;
  showForm = false;
  editingSuiteId: number | null = null;

  // Modal de confirmación para suite duplicada
  showDuplicateConfirmModal = false;
  duplicateSuiteName: string = '';
  pendingSuiteData: TestSuite | null = null;

  suiteForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private testomatService: TestomatService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.suiteForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.testomatService.currentProject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.currentProject = project;
        if (project && project.id) {
          this.loadSuites(project.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las suites de un proyecto
   */
  loadSuites(projectId: number): void {
    this.loading = true;
    this.error = null;

    this.testomatService.getTestSuites(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suites) => {
          this.suites = suites;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar suites:', err);
          this.error = 'No se pudieron cargar las suites. Intenta de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Abre el formulario para crear una nueva suite
   */
  openCreateForm(): void {
    this.showForm = true;
    this.editingSuiteId = null;
    this.suiteForm.reset({ status: 'active' });
  }

  /**
   * Abre el formulario para editar una suite
   */
  openEditForm(suite: TestSuite): void {
    this.showForm = true;
    this.editingSuiteId = suite.id || null;
    this.suiteForm.patchValue(suite);
  }

  /**
   * Cierra el formulario
   */
  closeForm(): void {
    this.showForm = false;
    this.suiteForm.reset({ status: 'active' });
  }

  /**
   * Guarda una nueva suite o actualiza una existente
   */
  saveSuite(): void {
    if (this.suiteForm.invalid || !this.currentProject?.id) {
      return;
    }

    const suiteData: TestSuite = {
      test_project_id: this.currentProject.id,
      ...this.suiteForm.value
    };

    if (this.editingSuiteId) {
      // Actualizar suite existente
      this.testomatService.updateTestSuite(this.editingSuiteId, suiteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            const index = this.suites.findIndex(s => s.id === this.editingSuiteId);
            if (index > -1) {
              this.suites[index] = updated;
            }
            this.closeForm();
          },
          error: (err) => {
            console.error('Error al actualizar suite:', err);
            this.error = 'No se pudo actualizar la suite.';
          }
        });
    } else {
      // Verificar si ya existe una suite con el mismo nombre
      this.testomatService.checkSuiteNameExists(this.currentProject.id, suiteData.name)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            if (result.exists) {
              // Mostrar modal de confirmación
              this.duplicateSuiteName = suiteData.name;
              this.pendingSuiteData = suiteData;
              this.showDuplicateConfirmModal = true;
            } else {
              // Crear directamente
              this.createSuiteDirectly(suiteData);
            }
          },
          error: (err) => {
            console.error('Error al verificar nombre:', err);
            // Si falla la verificación, intentar crear de todas formas
            this.createSuiteDirectly(suiteData);
          }
        });
    }
  }

  /**
   * Crea la suite directamente sin verificación adicional
   */
  private createSuiteDirectly(suiteData: TestSuite): void {
    if (!this.currentProject?.id) return;

    this.testomatService.createTestSuite(this.currentProject.id, suiteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newSuite) => {
          this.suites.push(newSuite);
          this.suites = [...this.suites]; // Force change detection
          this.closeForm();
          this.closeDuplicateModal();
          // Recargar suites para asegurar sincronización
          if (this.currentProject?.id) {
            this.loadSuites(this.currentProject.id);
          }
        },
        error: (err) => {
          console.error('❌ Error al crear suite:', err);
          this.error = 'No se pudo crear la suite.';
        }
      });
  }

  /**
   * Confirma la creación de una suite duplicada
   */
  confirmDuplicateSuite(): void {
    if (this.pendingSuiteData) {
      this.createSuiteDirectly(this.pendingSuiteData);
    }
  }

  /**
   * Cierra el modal de confirmación de duplicado
   */
  closeDuplicateModal(): void {
    this.showDuplicateConfirmModal = false;
    this.duplicateSuiteName = '';
    this.pendingSuiteData = null;
  }

  /**
   * Inicia una nueva ejecución para la suite
   */
  startExecution(suite: TestSuite): void {
    if (!suite.id) return;

    // Guardar suite actual y crear ejecución
    this.testomatService.setCurrentSuite(suite);
    this.loading = true;

    this.testomatService.createTestExecution(suite.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (execution) => {
          this.loading = false;
          // Navegar al runner
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
   * Obtiene el estado visual de la suite
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'badge-success',
      'inactive': 'badge-warning',
      'deprecated': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  /**
   * Obtiene el texto del estado en español
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'deprecated': 'Deprecado'
    };
    return statusMap[status] || status;
  }

  /**
   * Verifica si hay un proyecto seleccionado
   */
  hasProjectSelected(): boolean {
    return !!this.currentProject?.id;
  }
}
