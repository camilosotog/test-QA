import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TestomatService, TestSuite, TestCase, TestStep } from '../services/testomat.service';
import { AuthService } from '../../../core/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-test-cases-library',
  templateUrl: './test-cases-library.component.html',
  styleUrls: ['./test-cases-library.component.scss']
})
export class TestCasesLibraryComponent implements OnInit, OnDestroy {
  currentSuite: TestSuite | null = null;
  suiteLoaded = false;
  testCases: TestCase[] = [];
  filteredTestCases: TestCase[] = [];
  loading = false;
  error: string | null = null;
  showForm = false;
  editingCaseId: number | null = null;
  selectedPriority = 'all';
  selectedAutomation = 'all';
  searchQuery = '';
  viewingCaseId: number | null = null;
  viewingCase: TestCase | null = null;
  showImportModal = false;
  importText = '';
  autoCreateSteps = true;
  setDefaultPriority = true;
  defaultTestType: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' | 'security' = 'functional';
  defaultPriority: 'critical' | 'high' | 'medium' | 'low' = 'medium';

  testCaseForm: FormGroup;
  private destroy$ = new Subject<void>();

  priorities = [
    { value: 'all', label: 'Todas las prioridades' },
    { value: 'critical', label: 'Crítica' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' }
  ];

  automationStatuses = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'automated', label: 'Automatizado' },
    { value: 'semi-automated', label: 'Semi-automatizado' },
    { value: 'manual', label: 'Manual' }
  ];

  testTypes = [
    { value: 'functional', label: 'Funcional' },
    { value: 'regression', label: 'Regresión' },
    { value: 'smoke', label: 'Smoke' },
    { value: 'integration', label: 'Integración' },
    { value: 'performance', label: 'Rendimiento' },
    { value: 'security', label: 'Seguridad' }
  ];

  constructor(
    private testomatService: TestomatService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.testCaseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      test_type: ['functional', Validators.required],
      priority: ['medium', Validators.required],
      automation_status: ['manual', Validators.required],
      status: ['draft', Validators.required],
      // Plantilla de estructura
      preconditions: [''],
      input_data: [''],
      steps: this.fb.array([this.createInitialStep()]),
      expected_result: [''],
      tags: [[]]
    });
  }

  ngOnInit(): void {
    // Escuchar cambios en la suite actual desde queryParams
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['suiteId']) {
          const suiteId = parseInt(params['suiteId']);
          this.loadSuiteInfo(suiteId);
          this.loadCases(suiteId);
        }
      });

    // Alternativa: cargar desde snapshot
    if (this.route.snapshot.queryParams['suiteId']) {
      const suiteId = this.route.snapshot.queryParams['suiteId'];
      this.loadSuiteInfo(suiteId);
      this.loadCases(parseInt(suiteId));
    }
  }

  /**
   * Carga la información de la suite
   */
  loadSuiteInfo(suiteId: number): void {
    this.testomatService.getTestSuiteById(suiteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suite) => {
          this.currentSuite = suite;
          this.suiteLoaded = true;
        },
        error: (err) => {
          console.error('Error al cargar suite:', err);
          this.error = 'Error al cargar la suite';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los casos de una suite
   */
  loadCases(suiteId: number): void {
    this.loading = true;
    this.error = null;

    this.testomatService.getTestCases(suiteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cases) => {
          this.testCases = cases;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar casos:', err);
          this.error = 'No se pudieron cargar los casos. Intenta de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Crea un step inicial (para el constructor, sin dependencias)
   */
  createInitialStep(): FormGroup {
    return this.fb.group({
      order: [1],
      description: ['', Validators.required]
    });
  }

  /**
   * Crea un control de step
   */
  createStep(): FormGroup {
    const stepsLength = this.getStepsArray().length;
    return this.fb.group({
      order: [stepsLength + 1],
      description: ['', Validators.required]
    });
  }

  /**
   * Obtiene el FormArray de steps
   */
  getStepsArray(): FormArray {
    return this.testCaseForm.get('steps') as FormArray;
  }

  /**
   * Agrega un nuevo step
   */
  addStep(): void {
    this.getStepsArray().push(this.createStep());
  }

  /**
   * Elimina un step
   */
  removeStep(index: number): void {
    if (this.getStepsArray().length > 1) {
      this.getStepsArray().removeAt(index);
    }
  }

  /**
   * Abre el formulario para crear un nuevo caso
   */
  openCreateForm(suiteId: number): void {
    this.showForm = true;
    this.editingCaseId = null;
    this.testCaseForm.reset({
      priority: 'medium',
      automation_status: 'manual',
      test_type: 'functional',
      status: 'draft',
      steps: [this.createStep()]
    });
  }

  /**
   * Abre el formulario para editar un caso
   */
  openEditForm(testCase: TestCase): void {
    this.showForm = true;
    this.editingCaseId = testCase.id || null;
    
    const stepsArray = this.getStepsArray();
    stepsArray.clear();
    
    if (testCase.steps && testCase.steps.length > 0) {
      testCase.steps.forEach(step => {
        stepsArray.push(this.fb.group({
          order: [step.order],
          description: [step.description, Validators.required]
        }));
      });
    } else {
      stepsArray.push(this.createStep());
    }

    this.testCaseForm.patchValue({
      name: testCase.name,
      description: testCase.description,
      test_type: testCase.test_type,
      priority: testCase.priority,
      automation_status: testCase.automation_status,
      status: testCase.status,
      preconditions: testCase.preconditions,
      input_data: testCase.input_data,
      expected_result: testCase.expected_result,
      tags: testCase.tags || []
    });
  }

  /**
   * Cierra el formulario
   */
  closeForm(): void {
    this.showForm = false;
  }

  /**
   * Elimina un caso de prueba
   */
  deleteTestCase(testCase: TestCase): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar el caso "${testCase.name}"?`)) {
      return;
    }

    if (!testCase.id) {
      this.error = 'Error: No se puede determinar el ID del caso.';
      return;
    }

    this.testomatService.deleteTestCase(testCase.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.testCases = this.testCases.filter(c => c.id !== testCase.id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error al eliminar caso:', err);
          this.error = 'No se pudo eliminar el caso. Intenta de nuevo.';
        }
      });
  }

  /**
   * Guarda un nuevo caso o actualiza uno existente
   */
  saveTestCase(): void {
    if (this.testCaseForm.invalid) {
      return;
    }

    if (!this.currentSuite?.id || !this.currentSuite?.test_project_id) {
      console.error('Suite no cargada correctamente:', this.currentSuite);
      this.error = 'Error: Suite no cargada. Por favor, recarga la página.';
      return;
    }

    const caseData: TestCase = {
      test_suite_id: this.currentSuite.id,
      test_project_id: this.currentSuite.test_project_id,
      ...this.testCaseForm.value
    };

    if (this.editingCaseId) {
      this.testomatService.updateTestCase(this.editingCaseId, caseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            const index = this.testCases.findIndex(c => c.id === this.editingCaseId);
            if (index > -1) {
              this.testCases[index] = updated;
            }
            this.applyFilters();
            this.closeForm();
          },
          error: (err) => {
            console.error('Error al actualizar caso:', err);
            this.error = 'No se pudo actualizar el caso.';
          }
        });
    } else {
      this.testomatService.createTestCase(caseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newCase) => {
            this.testCases.push(newCase);
            this.applyFilters();
            this.closeForm();
          },
          error: (err) => {
            console.error('Error al crear caso:', err);
            this.error = 'No se pudo crear el caso.';
          }
        });
    }
  }

  /**
   * Aplica filtros y búsqueda
   */
  applyFilters(): void {
    this.filteredTestCases = this.testCases.filter(testCase => {
      const matchPriority = this.selectedPriority === 'all' || testCase.priority === this.selectedPriority;
      const matchAutomation = this.selectedAutomation === 'all' || testCase.automation_status === this.selectedAutomation;
      const matchSearch = this.searchQuery === '' || 
        testCase.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        testCase.description?.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchPriority && matchAutomation && matchSearch;
    });
  }

  /**
   * Actualiza filtros
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Abre el modal para ver detalles de un caso sin permitir edición
   */
  viewTestCaseDetails(testCase: TestCase): void {
    this.viewingCase = testCase;
    this.viewingCaseId = testCase.id || null;
  }

  /**
   * Cierra el modal de visualización
   */
  closeViewModal(): void {
    this.viewingCase = null;
    this.viewingCaseId = null;
  }

  /**
   * Abre el modal de importación
   */
  openImportModal(): void {
    this.showImportModal = true;
    this.importText = '';
  }

  /**
   * Cierra el modal de importación
   */
  closeImportModal(): void {
    this.showImportModal = false;
    this.importText = '';
  }

  /**
   * Parsea el texto y crea casos de prueba automáticamente
   */
  importCasesFromText(): void {
    if (!this.importText.trim() || !this.currentSuite) {
      return;
    }

    // Separar por bloques (dos saltos de línea)
    const blocks = this.importText.split(/\n\n+/).filter(block => block.trim());
    let successCount = 0;
    let errorCount = 0;

    blocks.forEach((block, blockIndex) => {
      try {
        const testCase = this.parseTestCaseBlock(block);
        
        if (testCase && this.currentSuite && this.currentSuite.id) {
          testCase.test_suite_id = this.currentSuite.id;
          testCase.test_project_id = this.currentSuite.test_project_id;
          
          this.testomatService.createTestCase(testCase)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                successCount++;
                if (successCount + errorCount === blocks.length) {
                  this.finishImport(successCount, errorCount);
                }
              },
              error: (err) => {
                errorCount++;
                console.error(`❌ Error creando caso ${blockIndex + 1}:`, err);
                if (successCount + errorCount === blocks.length) {
                  this.finishImport(successCount, errorCount);
                }
              }
            });
        }
      } catch (e) {
        errorCount++;
        console.error(`❌ Error parseando bloque ${blockIndex + 1}:`, e);
        if (successCount + errorCount === blocks.length) {
          this.finishImport(successCount, errorCount);
        }
      }
    });
  }

  /**
   * Parsea un bloque de texto a TestCase
   */
  private parseTestCaseBlock(block: string): TestCase | null {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) return null;

    const testCase: Partial<TestCase> = {
      test_type: this.defaultTestType,
      priority: this.defaultPriority,
      automation_status: 'manual',
      status: 'draft',
      steps: [],
      preconditions: '',
      input_data: '',
      expected_result: '',
      description: ''
    };

    for (const line of lines) {
      // Detectar campos especiales (case-insensitive)
      const lineUpper = line.toUpperCase();
      
      if (lineUpper.startsWith('NOMBRE:')) {
        testCase.name = line.substring('NOMBRE:'.length).trim();
      } else if (lineUpper.startsWith('DESCRIPCIÓN:') || lineUpper.startsWith('DESCRIPCION:')) {
        testCase.description = line.split(':').slice(1).join(':').trim();
      } else if (lineUpper.startsWith('PRECONDICIONES:') || lineUpper.startsWith('PRECONDICION:')) {
        testCase.preconditions = line.split(':').slice(1).join(':').trim();
      } else if (lineUpper.startsWith('DATOS:') || lineUpper.startsWith('DATOS DE ENTRADA:')) {
        testCase.input_data = line.split(':').slice(1).join(':').trim();
      } else if (lineUpper.startsWith('PASO:')) {
        const stepDescription = line.split(':').slice(1).join(':').trim();
        if (stepDescription && this.autoCreateSteps) {
          const steps = testCase.steps || [];
          steps.push({
            order: steps.length + 1,
            description: stepDescription
          } as TestStep);
          testCase.steps = steps;
        }
      } else if (lineUpper.startsWith('RESULTADO:') || lineUpper.startsWith('RESULTADO ESPERADO:')) {
        testCase.expected_result = line.split(':').slice(1).join(':').trim();
      } else if (lineUpper.startsWith('PRIORIDAD:')) {
        const priority = line.substring('PRIORIDAD:'.length).trim().toLowerCase();
        if (['critical', 'high', 'medium', 'low'].includes(priority)) {
          testCase.priority = priority as 'critical' | 'high' | 'medium' | 'low';
        }
      } else if (lineUpper.startsWith('TIPO:')) {
        const type = line.substring('TIPO:'.length).trim().toLowerCase();
        if (['functional', 'regression', 'smoke', 'integration', 'performance', 'security'].includes(type)) {
          testCase.test_type = type as 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' | 'security';
        }
      }
    }

    if (!testCase.name) {
      testCase.name = 'Caso sin nombre';
    }

    return testCase as TestCase;
  }

  /**
   * Finaliza la importación y muestra resultado
   */
  private finishImport(successCount: number, errorCount: number): void {
    this.closeImportModal();
    
    if (this.currentSuite?.id) {
      this.loadCases(this.currentSuite.id);
    }
    
    const message = `✅ Se importaron ${successCount} caso(s) correctamente${errorCount > 0 ? ` y ${errorCount} fallaron` : ''}`;
    this.error = null;
    
    // Mostrar notificación (opcional)
    setTimeout(() => {
      alert(message);
    }, 300);
  }

  /**
   * Obtiene el texto del tipo de prueba
   */
  getTestTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'functional': 'Funcional',
      'regression': 'Regresión',
      'smoke': 'Smoke',
      'integration': 'Integración',
      'performance': 'Rendimiento',
      'security': 'Seguridad'
    };
    return typeMap[type] || type;
  }

  /**
   * Obtiene el texto de automatización
   */
  getAutomationText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'automated': 'Automatizado',
      'semi-automated': 'Semi-automatizado',
      'manual': 'Manual'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene el color de la prioridad
   */
  getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'critical': '#dc3545',
      'high': '#fd7e14',
      'medium': '#ffc107',
      'low': '#28a745'
    };
    return colorMap[priority] || '#6c757d';
  }
}
