import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TestomatService, TestExecution, TestCase } from '../services/testomat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-test-execution-runner',
  templateUrl: './test-execution-runner.component.html',
  styleUrls: ['./test-execution-runner.component.scss']
})
export class TestExecutionRunnerComponent implements OnInit, OnDestroy {
  execution: TestExecution | null = null;
  cases: TestCase[] = [];
  currentCaseIndex = 0;
  loading = false;
  saving = false;
  deletingEvidence = false; // Flag para indicar que se está eliminando una evidencia
  error: string | null = null;
  
  resultForm: FormGroup;
  suiteForm: FormGroup; // Formulario para seleccionar QA y Dev para toda la suite
  evidenceFiles: File[] = [];

  // Usuarios por rol
  qaUsers: Array<{id: number; name: string; email: string; user_role: string}> = [];
  devUsers: Array<{id: number; name: string; email: string; user_role: string}> = [];
  
  // Valores seleccionados para toda la suite
  selectedQA: string = '';
  selectedQAId: number = 0;  // 🆕 Almacenar ID del QA
  selectedDev: string = '';
  selectedDevId: number = 0; // 🆕 Almacenar ID del Developer
  
  hasUpdatedBoardOnFirstResult = false; // 🆕 Flag para actualizar board solo una vez

  private destroy$ = new Subject<void>();

  constructor(
    private testomatService: TestomatService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.suiteForm = this.fb.group({
      tester_name: ['', Validators.required],
      developer_name: ['', Validators.required]
    });
    
    this.resultForm = this.fb.group({
      status: ['pass', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Cargar usuarios QA y DEV
    this.loadUsers();

    const executionId = this.route.snapshot.paramMap.get('executionId');
    if (executionId) {
      this.loadExecution(parseInt(executionId));
    }
    
    // Escuchar cambios en el formulario de suite
    this.suiteForm.get('tester_name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedQA = value;
        // 🆕 Obtener el ID del QA seleccionado
        const qaUser = this.qaUsers.find(u => u.name === value);
        if (qaUser) {
          this.selectedQAId = qaUser.id;
        }
      });
    
    this.suiteForm.get('developer_name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedDev = value;
        // 🆕 Obtener el ID del Developer seleccionado
        const devUser = this.devUsers.find(u => u.name === value);
        if (devUser) {
          this.selectedDevId = devUser.id;
        }
      });
  }

  /**
   * Carga los usuarios QA y DEV disponibles
   */
  loadUsers(): void {
    // 🚀 OPTIMIZACIÓN: Una sola llamada para obtener todos los usuarios por roles
    this.testomatService.getUsersByRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userGroups) => {
          this.qaUsers = userGroups.qa || [];
          this.devUsers = userGroups.dev || [];
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          // Fallback al método anterior si hay problemas
          this.loadUsersFallback();
        }
      });
  }

  /**
   * Método de respaldo para cargar usuarios (método anterior)
   */
  private loadUsersFallback(): void {
    // Cargar usuarios QA
    this.testomatService.getUsersByRole('QA')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qaUsers) => {
          // Cargar también ADMINs para agregarlos a la lista de QA
          this.testomatService.getUsersByRole('ADMIN')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (adminUsers) => {
                this.qaUsers = [...qaUsers, ...adminUsers];
              },
              error: (err) => {
                this.qaUsers = qaUsers;
                console.error('Error al cargar usuarios ADMIN:', err);
              }
            });
        },
        error: (err) => {
          console.error('Error al cargar usuarios QA:', err);
        }
      });

    // Cargar usuarios DEV
    this.testomatService.getUsersByRole('DEV')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.devUsers = users;
        },
        error: (err) => {
          console.error('Error al cargar usuarios DEV:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga una ejecución específica
   */
  loadExecution(executionId: number): void {
    this.loading = true;
    this.error = null;

    this.testomatService.getTestExecutionById(executionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (execution: any) => {
          this.execution = execution;
          // El backend ahora retorna 'cases' directamente
          this.cases = execution.cases || [];
          this.currentCaseIndex = 0;
          this.loading = false;
          // Cargar los datos del primer caso inmediatamente
          this.loadCaseResult();
        },
        error: (err) => {
          console.error('Error al cargar ejecución:', err);
          this.error = 'No se pudo cargar la ejecución.';
          this.loading = false;
        }
      });
  }

  /**
   * Obtiene el caso actual
   */
  getCurrentCase(): TestCase | null {
    const caseAtIndex = this.cases[this.currentCaseIndex] || null;
    if (!caseAtIndex) {
      console.warn('⚠️ No case found at index:', this.currentCaseIndex);
    }
    return caseAtIndex;
  }

  /**
   * Obtiene los resultados esperados del caso o resumidos de los pasos
   */
  getExpectedResults(testCase: TestCase | null): string | null {
    if (!testCase) return null;
    
    // Si el caso tiene un resultado esperado general, devolverlo
    if (testCase.expected_result) {
      return testCase.expected_result;
    }
    
    // Si no, compilar un resumen de los resultados esperados de los pasos
    if (testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0) {
      const stepsWithExpectedResults = testCase.steps
        .filter((step: any) => step.expected_result)
        .map((step: any, idx: number) => `${idx + 1}. ${step.expected_result}`)
        .join('\n');
      
      return stepsWithExpectedResults || null;
    }
    
    return null;
  }

  /**
   * Va al siguiente caso
   */
  nextCase(): void {
    if (this.currentCaseIndex < this.cases.length - 1) {
      this.currentCaseIndex++;
      this.loadCaseResult();
    }
  }

  /**
   * Va al caso anterior
   */
  previousCase(): void {
    if (this.currentCaseIndex > 0) {
      this.currentCaseIndex--;
      this.loadCaseResult();
    }
  }

  /**
   * Salta a un caso específico
   */
  goToCase(index: number): void {
    if (index >= 0 && index < this.cases.length) {
      this.currentCaseIndex = index;
      this.loadCaseResult();
    }
  }

  /**
   * Carga los datos del resultado si existe
   */
  private loadCaseResult(): void {
    const currentCase = this.getCurrentCase();
    if (!currentCase) {
      this.resetForm();
      // NO limpiar evidenceFiles aquí - el usuario podría querer mantener sus selecciones
      return;
    }

    // Si el caso tiene un resultado guardado, cargar sus datos
    if (currentCase.result_id) {
      this.resultForm.patchValue({
        status: currentCase.result_status || currentCase.status || 'pass',
        notes: currentCase.result_notes || '',
        tester_name: currentCase.tester_name || '',
        developer_name: currentCase.developer_name || ''
      });

      // Cargar evidencias si existen
      if (currentCase.evidence_urls) {
        const urls = typeof currentCase.evidence_urls === 'string' 
          ? JSON.parse(currentCase.evidence_urls) 
          : currentCase.evidence_urls;
        
        if (Array.isArray(urls) && urls.length > 0) {
        }
      }
    } else {
      this.resetForm();
    }
  }

  /**
   * Guarda el resultado del caso actual
   */
  saveResult(): void {
    if (!this.execution || !this.resultForm.valid) {
      return;
    }

    const currentCase = this.getCurrentCase();
    if (!currentCase) return;

    this.saving = true;

    // Si la ejecución está completada/fallida, cambiarla a in_progress
    const needsStatusUpdate = this.execution.status === 'completed' || this.execution.status === 'failed';
    
    const result = {
      test_case_id: currentCase.id,
      execution_id: this.execution.id,
      status: this.resultForm.value.status,
      notes: this.resultForm.value.notes,
      tester_name: this.selectedQA,
      developer_name: this.selectedDev
    };

    this.testomatService.saveTestResult(result, this.evidenceFiles.length > 0 ? this.evidenceFiles : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          
          // 🆕 Al guardar el primer resultado, actualizar el board con los datos correctos de QA y Dev
          if (!this.hasUpdatedBoardOnFirstResult && this.execution && this.selectedQAId > 0) {
            this.updateBoardWithExecutorInfo();
          }
          
          // Si la ejecución estaba completada, cambiarla a in_progress
          if (needsStatusUpdate) {
            this.changeExecutionStatusToInProgress();
          }
          
          // Limpiar nuevos archivos (las evidencias guardadas permanecerán)
          this.evidenceFiles = [];
          
          // Recargar la ejecución para obtener las nuevas evidencias
          if (this.execution && this.execution.id) {
            this.testomatService.getTestExecutionById(this.execution.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (updatedExecution: any) => {
                  this.execution = updatedExecution;
                  
                  // El backend ahora retorna cases directamente
                  const newCases = updatedExecution.cases || [];
                  
                  // Encontrar el caso que acabamos de actualizar en el nuevo array
                  const updatedCaseIndex = newCases.findIndex((c: any) => c.id === currentCase.id);
                  
                  // Actualizar el array y el índice si es necesario
                  this.cases = newCases;
                  if (updatedCaseIndex > -1) {
                    this.currentCaseIndex = updatedCaseIndex;
                  }
                  
                  // Marcar el caso como completado
                  if (currentCase.id && updatedCaseIndex > -1) {
                    this.cases[updatedCaseIndex].status = 'completed';
                  }
                  
                  // LIMPIAR los archivos seleccionados después de guardar exitosamente
                  this.evidenceFiles = [];
                  
                  this.saving = false;
                  
                  // Recargar el caso actual para mostrar las nuevas evidencias
                  this.loadCaseResult();
                  
                  // Ir al siguiente caso si existe
                  if (this.currentCaseIndex < this.cases.length - 1) {
                    setTimeout(() => this.nextCase(), 500);
                  }
                },
                error: (err) => {
                  console.error('❌ Error al recargar ejecución:', err);
                  this.saving = false;
                }
              });
          }
        },
        error: (err) => {
          console.error('❌ Error al guardar resultado:', err);
          this.error = 'No se pudo guardar el resultado.';
          this.saving = false;
        }
      });
  }

  /**
   * Maneja la selección de archivos de evidencia
   * ACUMULA los archivos en lugar de reemplazarlos
   */
  onEvidenceSelected(event: any): void {
    const files = event.target.files;
    // Agregar los archivos nuevos al array existente (acumular)
    for (let i = 0; i < files.length; i++) {
      this.evidenceFiles.push(files[i]);
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  }

  /**
   * Maneja el pegado de imágenes desde el portapapeles
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const items = event.clipboardData?.items;
    
    if (!items) {
      console.warn('⚠️ No se encontraron elementos en el portapapeles');
      return;
    }

    // Iterar sobre los items del portapapeles
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Verificar si el item es una imagen
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Generar un nombre para la imagen pegada
          const timestamp = new Date().getTime();
          const extension = file.type.split('/')[1] || 'png';
          const newFileName = `pasted-image-${timestamp}.${extension}`;
          
          // Crear un nuevo File con el nombre generado
          const renamedFile = new File([file], newFileName, { type: file.type });
          this.evidenceFiles.push(renamedFile);
          
        }
      }
    }

  }

  /**
   * Elimina un archivo de evidencia
   */
  removeEvidence(index: number): void {
    this.evidenceFiles.splice(index, 1);
  }

  /**
   * Formatea el tamaño de un archivo en bytes a formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Cambia el estado de la ejecución a in_progress (usada cuando se modifica una ejecución completada)
   */
  changeExecutionStatusToInProgress(): void {
    if (!this.execution?.id) return;

    this.testomatService.reopenTestExecution(this.execution.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.execution!.status = response.status || 'in_progress';
          this.execution!.execution_status = response.execution_status || 'in_progress';
          this.execution!.end_date = response.end_date || null;
        },
        error: (error) => {
          console.error('❌ Error reabriendo ejecución:', error);
        }
      });
  }

  /**
   * 🆕 Actualiza el board con los datos correctos de QA y Developer
   * Se llama al guardar el primer resultado
   */
  updateBoardWithExecutorInfo(): void {
    if (!this.execution?.id || this.selectedQAId <= 0) return;

    // Llamar al backend para actualizar el board
    this.testomatService.updateBoardExecutors(
      this.execution.id,
      this.selectedQAId,
      this.selectedDevId
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        this.hasUpdatedBoardOnFirstResult = true;
      },
      error: (error) => {
        console.warn('⚠️ No se pudo actualizar el board (esto es no-crítico):', error);
        // No bloquear si falla la actualización del board
        this.hasUpdatedBoardOnFirstResult = true;
      }
    });
  }

  /**
   */
  completeExecution(): void {
    if (!this.execution?.id) return;

    if (confirm('¿Está seguro de que desea finalizar esta ejecución? Después podrá continuar ejecutando nuevamente si es necesario.')) {
      this.saving = true;
      this.testomatService.completeTestExecution(this.execution.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            // Usar el estado devuelto por el backend
            this.execution!.status = response.status || 'completed';
            this.execution!.execution_status = response.execution_status || 'completed';
            this.saving = false;
            
            // Esperar un segundo y luego redirigir a la lista de ejecuciones
            setTimeout(() => {
              this.router.navigate(['/testomat/ejecuciones']);
            }, 1000);
          },
          error: (err) => {
            console.error('❌ Error al completar ejecución:', err);
            this.error = 'No se pudo completar la ejecución.';
            this.saving = false;
          }
        });
    }
  }

  /**
   * Continúa la ejecución (marca como "en progreso" nuevamente)
   */
  continueExecution(): void {
    if (!this.execution?.id) return;

    this.saving = true;
    this.testomatService.reopenTestExecution(this.execution.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.execution!.status = response.status || 'in_progress';
          this.execution!.execution_status = response.execution_status || 'in_progress';
          this.saving = false;
          this.error = null;
        },
        error: (err) => {
          console.error('❌ Error al reabrir ejecución:', err);
          this.error = 'No se pudo continuar la ejecución.';
          this.saving = false;
        }
      });
  }

  /**
   * Reinicia el formulario
   */
  private resetForm(): void {
    this.resultForm.reset({ status: 'pass' });
    this.evidenceFiles = [];
  }

  /**
   * Actualiza el estado de carga
   */
  private loadCaseLoading(value: boolean): void {
    this.loading = value;
  }

  /**
   * Obtiene el porcentaje de progreso
   */
  getProgressPercentage(): number {
    if (this.cases.length === 0) return 0;
    const completed = this.cases.filter(c => c.status === 'completed').length;
    return Math.round((completed / this.cases.length) * 100);
  }

  /**
   * Obtiene los porcentajes por estado para la barra segmentada
   */
  getSegmentedProgress(): { pass: number; fail: number; blocked: number; skipped: number } {
    if (this.cases.length === 0) {
      return { pass: 0, fail: 0, blocked: 0, skipped: 0 };
    }

    // Contar casos por resultado guardado en execution
    const passed = this.execution?.passed_cases || 0;
    const failed = this.execution?.failed_cases || 0;
    const total = this.cases.length;
    
    // Casos pendientes = total - ejecutados
    const executed = passed + failed;
    const pending = total - executed;

    // Calcular porcentajes
    return {
      pass: Math.round((passed / total) * 100),
      fail: Math.round((failed / total) * 100),
      blocked: 0, // Reservado para futuros casos bloqueados
      skipped: Math.round((pending / total) * 100)
    };
  }

  /**
   * Obtiene el ancho en porcentaje para cada segmento
   */
  getSegmentWidth(type: 'pass' | 'fail' | 'blocked' | 'skipped'): string {
    const segments = this.getSegmentedProgress();
    return `${segments[type]}%`;
  }

  /**
   * Obtiene el color del status badge
   */
  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'completed': 'badge-success',
      'pass': 'badge-success',
      'fail': 'badge-danger',
      'pending': 'badge-secondary',
      'blocked': 'badge-warning',
      'skipped': 'badge-info'
    };
    return classMap[status] || 'badge-secondary';
  }

  /**
   * Obtiene el texto del status
   */
  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'pass': 'Pasó',
      'fail': 'Falló',
      'blocked': 'Bloqueado',
      'skipped': 'Saltado',
      'completed': 'Completado'
    };
    return textMap[status] || status;
  }

  /**
   * Verifica si es el último caso
   */
  isLastCase(): boolean {
    return this.currentCaseIndex === this.cases.length - 1;
  }

  /**
   * Obtiene el número de casos completados
   */
  getCompletedCount(): number {
    return this.cases.filter(c => c.status === 'completed').length;
  }

  /**
   * Obtiene las URLs de evidencias guardadas del caso actual
   */
  getSavedEvidenceUrls(): string[] {
    const currentCase = this.getCurrentCase();
    if (!currentCase || !currentCase.evidence_urls) {
      return [];
    }

    try {
      const urls = typeof currentCase.evidence_urls === 'string'
        ? JSON.parse(currentCase.evidence_urls)
        : currentCase.evidence_urls;
      
      const result = Array.isArray(urls) ? urls : [];
      return result;
    } catch (e) {
      console.error('Error parsing evidence URLs:', currentCase.evidence_urls, e);
      return [];
    }
  }

  /**
   * Elimina una evidencia guardada del caso actual
   */
  deleteSavedEvidence(url: string): void {
    const currentCase = this.getCurrentCase();
    if (!currentCase || !this.execution) {
      return;
    }

    // Confirmar eliminación
    if (!confirm('¿Estás seguro de eliminar esta evidencia? Esta acción no se puede deshacer.')) {
      return;
    }

    this.deletingEvidence = true;

    this.testomatService.deleteEvidence(this.execution.id!, currentCase.id!, url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Evidencia eliminada:', response);
          
          // Actualizar las URLs localmente sin recargar toda la ejecución
          if (currentCase.evidence_urls) {
            try {
              let urls = typeof currentCase.evidence_urls === 'string' 
                ? JSON.parse(currentCase.evidence_urls) 
                : currentCase.evidence_urls;
              
              if (Array.isArray(urls)) {
                urls = urls.filter((u: string) => u !== url);
                currentCase.evidence_urls = urls.length > 0 ? JSON.stringify(urls) : '';
              }
            } catch (e) {
              console.error('Error actualizando URLs localmente:', e);
            }
          }

          this.deletingEvidence = false;
        },
        error: (err) => {
          console.error('❌ Error al eliminar evidencia:', err);
          this.error = 'No se pudo eliminar la evidencia.';
          this.deletingEvidence = false;
        }
      });
  }

  /**
   * Extrae el nombre del archivo de una URL de S3
   */
  extractFileName(url: string): string {
    try {
      // Extrae el nombre del archivo de la URL
      // Formato: https://qa-oncredit.s3.amazonaws.com/test-evidence/timestamp-filename
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      
      // Si tiene parámetros de query, quitarlos
      const cleanName = filename.split('?')[0];
      
      // Decodificar si está encodificado
      return decodeURIComponent(cleanName);
    } catch {
      return 'Evidencia';
    }
  }

  /**
   * Determina si una URL corresponde a una imagen
   */
  isImageAttachment(url: string): boolean {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  }

  /**
   * Convierte URL de imagen a base64 para incrustación en PDF
   */
  private async urlToBase64(url: string, retries = 3): Promise<string> {
    try {
      
      // Fetch con reintentos automáticos
      let lastError;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'image/*',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          if (!blob || blob.size === 0) {
            throw new Error('Blob vacío o inválido');
          }
          
          // Convertir Blob a Base64
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
              const result = reader.result as string;
              if (result && result.startsWith('data:image/')) {
                resolve(result);
              } else if (result && result.startsWith('data:')) {
                resolve(result);
              } else {
                reject(new Error('Base64 inválido o corrupto'));
              }
            };
            
            reader.onerror = (error) => {
              reject(new Error(`FileReader error: ${error}`));
            };
            
            reader.onabort = () => {
              reject(new Error('FileReader abortado'));
            };
            
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Intento ${attempt}/${retries} falló:`, error);
          
          if (attempt < retries) {
            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Si llegas aquí, todos los reintentos fallaron
      throw lastError || new Error('Todos los reintentos fallaron');
    } catch (error) {
      console.error(`❌ NO se pudo cargar imagen a Base64: ${url}`, error);
      return ''; // Retornar vacío si falla
    }
  }

  /**
   * Exporta la ejecución actual a PDF
   */
  async exportToPDF(): Promise<void> {
    if (!this.execution) {
      this.error = 'No hay ejecución para exportar';
      return;
    }

    try {
      // Importar pdfmake dinámicamente
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
      
      // Asignar fuentes correctamente
      if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      } else if (pdfFonts && pdfFonts.vfs) {
        pdfMake.vfs = pdfFonts.vfs;
      } else {
        // Si no hay fuentes, usar sin ellas (fallback)
        console.warn('⚠️ No se pudieron cargar las fuentes de pdfmake');
      }

      // Precargar imágenes a base64 ANTES de generar el PDF
      // ⭐ CRÍTICO: Las imágenes DEBEN estar en base64 para que aparezcan en el PDF
      const imageCache = new Map<string, string>();
      let successCount = 0;
      let failCount = 0;
      
      // Recolectar todas las imágenes primero
      const imagesToLoad: Array<{ url: string; fileName: string }> = [];
      
      for (const testCase of this.cases) {
        const urls = this.getSavedEvidenceUrlsForCase(testCase);
        for (const url of urls) {
          const fileName = this.extractFileName(url);
          // ✅ Solo procesar imágenes (jpg, jpeg, png, gif, webp)
          // ❌ NO procesar videos - llevarán solo URL
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
            if (!imageCache.has(url)) {
              imagesToLoad.push({ url, fileName });
            }
          }
        }
      }
      
      // Descargar imágenes EN PARALELO (máximo 5 simultáneamente)
      const PARALLEL_LIMIT = 5;
      for (let i = 0; i < imagesToLoad.length; i += PARALLEL_LIMIT) {
        const batch = imagesToLoad.slice(i, i + PARALLEL_LIMIT);
        const batchPromises = batch.map(async ({ url, fileName }) => {
          try {
            const base64 = await this.urlToBase64(url);
            if (base64 && base64.length > 20) {
              imageCache.set(url, base64);
              successCount++;
              const sizeKB = Math.round(base64.length / 1024);
            } else {
              failCount++;
              console.error(`  ❌ ${fileName} - Base64 inválido o vacío`);
            }
          } catch (error) {
            failCount++;
            console.error(`  ❌ ${fileName} - Error al convertir: ${error}`);
          }
        });
        
        // Esperar a que terminen las descargas de este lote
        await Promise.all(batchPromises);
      }

      // Mostrar notificación al usuario
      if (successCount > 0) {
        console.info(`✅ ${successCount} imagen(es) incrustada(s) en el PDF`);
      }
      if (failCount > 0) {
        console.warn(`⚠️ ${failCount} imagen(es) no pudieron incrustarse - usarán enlace`);
      }

      // Construir el contenido del PDF
      const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: this.buildPDFContent(imageCache),
        styles: {
          title: {
            fontSize: 18,
            bold: true,
            color: '#1a1a1a',
            margin: [0, 0, 0, 20]
          },
          subtitle: {
            fontSize: 14,
            bold: true,
            color: '#333',
            margin: [0, 15, 0, 10]
          },
          header: {
            fontSize: 12,
            bold: true,
            color: '#fff',
            fillColor: '#198754'
          },
          tableCell: {
            fontSize: 10,
            margin: [5, 5, 5, 5]
          },
          boldCell: {
            fontSize: 10,
            bold: true,
            margin: [5, 5, 5, 5]
          },
          success: {
            color: '#28a745'
          },
          danger: {
            color: '#dc3545'
          },
          warning: {
            color: '#ffc107'
          }
        }
      };

      // Generar PDF
      pdfMake.createPdf(documentDefinition).download(
        `Ejecucion_${this.execution.suite_name}_${new Date().toLocaleDateString('es-CO')}.pdf`
      );

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      this.error = 'Error al generar el PDF';
    }
  }

  /**
   * Construye el contenido del PDF - Mejorado con detalles por caso
   */
  private buildPDFContent(imageCache: Map<string, string> = new Map()): any[] {
    const content: any[] = [];

    // Título principal
    content.push({
      text: 'Reporte de Ejecución de Pruebas',
      style: 'title'
    });

    // Información general
    content.push({
      text: 'Información General',
      style: 'subtitle'
    });

    const generalInfo = [
      { label: 'Suite:', value: this.execution?.suite_name || 'N/A' },
      { label: 'Estado:', value: this.execution?.status === 'failed' ? 'FALLIDA' : (this.execution?.status === 'completed' ? 'COMPLETADA' : this.execution?.status || 'N/A') },
      { label: 'Ejecutada por:', value: this.execution?.executed_by_name || 'N/A' },
      { label: 'Fecha de inicio:', value: this.execution?.started_at ? new Date(this.execution.started_at).toLocaleString('es-CO') : 'N/A' },
      { label: 'Total de casos:', value: `${this.execution?.total_cases || 0}` },
      { label: 'Casos pasados:', value: `${this.execution?.passed_cases || 0}` },
      { label: 'Casos fallidos:', value: `${this.execution?.failed_cases || 0}` },
      { label: 'Casos pendientes:', value: `${(this.execution?.total_cases || 0) - (this.execution?.passed_cases || 0) - (this.execution?.failed_cases || 0)}` }
    ];

    const infoTable = {
      table: {
        widths: ['40%', '60%'],
        body: generalInfo.map(item => [
          { text: item.label, style: 'boldCell', fillColor: '#f0f0f0' },
          { text: item.value, style: 'tableCell' }
        ])
      },
      margin: [0, 0, 0, 20]
    };

    content.push(infoTable);

    // Resumen rápido
    content.push({
      text: 'Resumen de Resultados',
      style: 'subtitle'
    });

    const passRate = this.execution?.total_cases ? Math.round(((this.execution?.passed_cases || 0) / this.execution.total_cases) * 100) : 0;
    
    content.push({
      columns: [
        {
          text: `Tasa de Éxito: ${passRate}%`,
          fontSize: 12,
          bold: true,
          color: passRate >= 80 ? '#28a745' : passRate >= 50 ? '#ffc107' : '#dc3545'
        }
      ],
      margin: [0, 0, 0, 20]
    });

    // ===== CASOS DETALLADOS =====
    content.push({
      text: 'Detalles de Cada Caso de Prueba',
      style: 'subtitle',
      pageBreak: 'before'
    });

    this.cases.forEach((testCase, index) => {
      const statusColor = testCase.result_status === 'pass' ? '#28a745' : 
                         testCase.result_status === 'fail' ? '#dc3545' : '#ffc107';
      const statusText = testCase.result_status ? 
        (testCase.result_status === 'pass' ? 'PASÓ' :
         testCase.result_status === 'fail' ? 'FALLÓ' : 
         testCase.result_status === 'blocked' ? 'BLOQUEADO' : 'SALTADO') : 'PENDIENTE';

      // Encabezado del caso
      content.push({
        columns: [
          {
            text: `${index + 1}. ${testCase.name}`,
            fontSize: 12,
            bold: true,
            color: '#333'
          },
          {
            text: statusText,
            fontSize: 11,
            bold: true,
            color: statusColor,
            alignment: 'right'
          }
        ],
        margin: [0, 15, 0, 8],
        border: [false, false, false, true],
        borderColor: statusColor,
        borderWidth: [0, 0, 0, 2]
      });

      // Detalles del caso en tabla
      const caseDetailsArray = [];

      // Nombre del test
      caseDetailsArray.push([
        { text: 'Nombre del Test:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
        { text: testCase.name || 'N/A', style: 'tableCell' }
      ]);

      // Precondiciones
      if (testCase.preconditions) {
        caseDetailsArray.push([
          { text: 'Precondiciones:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.preconditions, style: 'tableCell' }
        ]);
      }

      // Pasos
      if (testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0) {
        const stepsText = testCase.steps
          .map((step: any, idx: number) => `${idx + 1}. ${step.description || step}`)
          .join('\n');
        caseDetailsArray.push([
          { text: 'Pasos:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: stepsText, style: 'tableCell' }
        ]);
      }

      // Resultado esperado (debajo de pasos)
      if (testCase.expected_result) {
        caseDetailsArray.push([
          { text: 'Resultado Esperado:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.expected_result, style: 'tableCell' }
        ]);
      }

      // Datos de entrada
      if (testCase.input_data) {
        caseDetailsArray.push([
          { text: 'Datos de Entrada:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.input_data, style: 'tableCell' }
        ]);
      }

      // Prioridad
      if (testCase.priority) {
        const priorityColor = testCase.priority === 'critical' ? '#dc3545' : 
                             testCase.priority === 'high' ? '#ff9800' :
                             testCase.priority === 'medium' ? '#ffc107' : '#28a745';
        caseDetailsArray.push([
          { text: 'Prioridad:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.priority.toUpperCase(), style: 'tableCell', color: priorityColor, bold: true }
        ]);
      }

      // Estado de la prueba
      caseDetailsArray.push([
        { text: 'Estado:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
        { text: statusText, style: 'tableCell', color: statusColor, bold: true }
      ]);

      // QA que probó
      if (testCase.tester_name) {
        caseDetailsArray.push([
          { text: 'QA Probador:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.tester_name, style: 'tableCell' }
        ]);
      }

      // Desarrollador (si está disponible)
      if (testCase.developer_name) {
        caseDetailsArray.push([
          { text: 'Desarrollador:', style: 'boldCell', fillColor: '#f0f0f0', width: '30%' },
          { text: testCase.developer_name, style: 'tableCell' }
        ]);
      }

      // Crear tabla con los detalles
      if (caseDetailsArray.length > 0) {
        content.push({
          table: {
            widths: ['30%', '70%'],
            body: caseDetailsArray
          },
          margin: [10, 5, 0, 10]
        });
      }

      // Anotaciones si existen
      const caseDetails = [];

      if (testCase.result_notes) {
        caseDetails.push({
          text: 'Anotaciones de Resultado:',
          fontSize: 9,
          bold: true,
          color: '#333',
          margin: [0, 8, 0, 3]
        });
        caseDetails.push({
          text: testCase.result_notes,
          fontSize: 9,
          color: '#666',
          margin: [15, 0, 0, 5],
          fillColor: '#fafafa'
        });
      }

      if (caseDetails.length > 0) {
        content.push(...caseDetails);
      }

      // Evidencias para este caso
      const urls = this.getSavedEvidenceUrlsForCase(testCase);
      if (urls.length > 0) {
        content.push({
          text: 'Evidencias:',
          fontSize: 9,
          bold: true,
          color: '#333',
          margin: [0, 8, 0, 5]
        });

        const evidenceContent: any[] = [];
        
        urls.forEach((url: string) => {
          const fileName = this.extractFileName(url);
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
          const isVideo = /\.(mp4|webm|mov|avi)$/i.test(fileName);

          if (isImage) {
            // ✅ Las imágenes SIEMPRE deben ir incrustadas en el PDF
            const base64Image = imageCache.get(url);
            
            if (base64Image && base64Image.length > 20) {
              // ✅ Imagen precargada correctamente - INSERTAR EN PDF
              evidenceContent.push({
                image: base64Image,
                width: 120,
                height: 'auto',
                fit: [120, 120],
                alignment: 'left',
                margin: [15, 0, 0, 8]
              });
            } else {
              // ⚠️ Si la imagen no se precargó bien, intentar inline desde URL
              // Esto es fallback - idealmente no debería pasar
              console.warn(`⚠️ Imagen no precargada correctamente: ${fileName}, usando URL fallback`);
              evidenceContent.push({
                text: `${fileName}\nAbre en navegador para ver`,
                color: '#0066cc',
                decoration: 'underline',
                link: url,
                margin: [15, 3, 0, 8],
                fontSize: 8
              });
            }
          } else if (isVideo) {
            // SOLO LOS VIDEOS LLEVAN URL (como enlaces clickeables)
            const videoPlatform = url.includes('s3.amazonaws.com') ? 'AWS S3' : 'Video';
            evidenceContent.push({
              text: `${videoPlatform} ${fileName}`,
              color: '#0066cc',
              decoration: 'underline',
              link: url,
              margin: [15, 3, 0, 8],
              fontSize: 9
            });
          } else {
            // Otros archivos (documentos, etc)
            evidenceContent.push({
              text: `${fileName}`,
              color: '#0066cc',
              decoration: 'underline',
              link: url,
              margin: [15, 3, 0, 8],
              fontSize: 9
            });
          }
        });
        
        if (evidenceContent.length > 0) {
          content.push(...evidenceContent);
        }
      }

      // Separador entre casos
      content.push({
        text: '',
        margin: [0, 10, 0, 0]
      });
    });

    // Nota final sobre acceso
    content.push({
      text: '',
      fontSize: 8,
      color: '#333',
      margin: [0, 20, 0, 0],
      italics: true,
      fillColor: '#e8f5e9',
      border: [1, 1, 1, 1],
      borderColor: '#28a745'
    });

    // Pie de página
    content.push({
      text: `Generado: ${new Date().toLocaleString('es-CO')}`,
      fontSize: 8,
      color: '#999',
      margin: [0, 20, 0, 0],
      alignment: 'center'
    });

    return content;
  }

  /**
   * Obtiene las URLs de evidencias para un caso específico
   */
  private getSavedEvidenceUrlsForCase(testCase: TestCase): string[] {
    if (!testCase.evidence_urls) {
      return [];
    }

    try {
      const urls = typeof testCase.evidence_urls === 'string'
        ? JSON.parse(testCase.evidence_urls)
        : testCase.evidence_urls;
      return Array.isArray(urls) ? urls : [];
    } catch {
      return [];
    }
  }
}
