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

  // ============================================
  // 📋 VARIABLES PARA DUPLICAR SUITE A OTRA CARPETA
  // ============================================
  showDuplicateToModal = false;
  duplicateLoading = false;
  duplicateError: string | null = null;
  selectedSuiteToDuplicate: TestSuite | null = null;
  availableProjects: TestProject[] = [];
  availableSuitesForDuplicate: TestSuite[] = [];
  selectedTargetProjectId: number | null = null;
  selectedTargetSuiteId: number | null = null;
  loadingProjects = false;
  loadingSuitesForDuplicate = false;

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
   * Elimina una suite
   */
  deleteSuite(suite: TestSuite): void {
    if (!suite.id) {
      this.error = 'No se puede eliminar: ID de suite no válido';
      return;
    }

    const confirmMessage = `¿Estás seguro de que deseas eliminar la suite "${suite.name}"?\n\nEsto eliminará también todos los casos de prueba asociados y sus resultados.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.loading = true;
    this.testomatService.deleteTestSuite(suite.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.suites = this.suites.filter(s => s.id !== suite.id);
          this.loading = false;
          // Mostrar mensaje de éxito (opcional)
          this.error = null;
        },
        error: (err) => {
          console.error('Error al eliminar suite:', err);
          this.error = 'No se pudo eliminar la suite. Intenta de nuevo.';
          this.loading = false;
        }
      });
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

  // ============================================
  // 📋 MÉTODOS PARA DUPLICAR SUITE A OTRA CARPETA
  // ============================================

  /**
   * Abre el modal para duplicar suite a otra carpeta
   */
  openDuplicateToModal(suite: TestSuite): void {
    if (!suite.id) return;

    this.selectedSuiteToDuplicate = suite;
    this.showDuplicateToModal = true;
    this.duplicateError = null;
    this.selectedTargetProjectId = null;
    this.selectedTargetSuiteId = null;
    this.availableSuitesForDuplicate = [];
    
    // Cargar proyectos disponibles
    this.loadAvailableProjects();
  }

  /**
   * Cierra el modal de duplicar suite
   */
  closeDuplicateToModal(): void {
    this.showDuplicateToModal = false;
    this.selectedSuiteToDuplicate = null;
    this.duplicateError = null;
    this.selectedTargetProjectId = null;
    this.selectedTargetSuiteId = null;
    this.availableProjects = [];
    this.availableSuitesForDuplicate = [];
  }

  /**
   * Carga todos los proyectos disponibles
   */
  loadAvailableProjects(): void {
    this.loadingProjects = true;
    this.testomatService.getTestProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // La respuesta puede venir con paginación o como array directo
          this.availableProjects = response.projects || response || [];
          this.loadingProjects = false;
        },
        error: (err) => {
          console.error('❌ Error cargando proyectos:', err);
          this.duplicateError = 'No se pudieron cargar los proyectos.';
          this.loadingProjects = false;
        }
      });
  }

  /**
   * Carga las suites del proyecto seleccionado
   */
  onTargetProjectSelected(): void {
    if (!this.selectedTargetProjectId) {
      this.availableSuitesForDuplicate = [];
      this.selectedTargetSuiteId = null;
      return;
    }

    this.loadingSuitesForDuplicate = true;
    this.selectedTargetSuiteId = null;
    this.testomatService.getTestSuites(this.selectedTargetProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suites) => {
          // Filtrar la suite actual si es el mismo proyecto
          this.availableSuitesForDuplicate = suites.filter(
            s => s.id !== this.selectedSuiteToDuplicate?.id
          );
          this.loadingSuitesForDuplicate = false;
        },
        error: (err) => {
          console.error('❌ Error cargando suites:', err);
          this.duplicateError = 'No se pudieron cargar las suites del proyecto.';
          this.loadingSuitesForDuplicate = false;
        }
      });
  }

  /**
   * Ejecuta la duplicación de los casos de la suite
   */
  executeDuplicateTo(): void {
    if (!this.selectedSuiteToDuplicate?.id || !this.selectedTargetSuiteId) {
      this.duplicateError = 'Selecciona un proyecto y una suite destino.';
      return;
    }

    this.duplicateLoading = true;
    this.duplicateError = null;

    this.testomatService.duplicateSuiteCases(
      this.selectedSuiteToDuplicate.id,
      this.selectedTargetSuiteId
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Suite duplicada:', response);
          
          // Cerrar modal
          this.closeDuplicateToModal();
          this.duplicateLoading = false;
          
          // Mostrar mensaje de éxito
          alert(
            `✅ Suite duplicada exitosamente!\n\n` +
            `Se copiaron ${response.copiedCases} casos de prueba de:\n` +
            `"${response.source.suiteName}" → "${response.target.suiteName}"`
          );

          // Recargar suites si estamos en el mismo proyecto
          if (this.currentProject?.id) {
            this.loadSuites(this.currentProject.id);
          }
        },
        error: (err) => {
          console.error('❌ Error al duplicar suite:', err);
          this.duplicateError = err.error?.error || 'No se pudo duplicar la suite. Intenta de nuevo.';
          this.duplicateLoading = false;
        }
      });
  }
}
