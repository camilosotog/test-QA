import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { QaItemsService, Board, Sprint, SprintWithBoards } from '../../core/qa-items.service';
import { AutomatedTasksService, AutomatedTask } from '../../core/automated-tasks.service';
import { AuthService } from '../../core/auth.service';
import { UsersService, User } from '../../core/users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-qa-items-list',
  templateUrl: './qa-items-list.component.html',
  styleUrls: ['./qa-items-list.component.scss']
})
export class QaItemsListComponent implements OnInit {
  // Devuelve true si el item tiene devoluciones mayores a 0
  hasReturns(item: Board): boolean {
    return !!item && !!item.returns && item.returns > 0;
  }
  // Devuelve los boards de un sprint filtrando nulos
  getBoardsSafe(sprintId: number): Board[] {
    const arr: Board[] = this.boardsBySprint && this.boardsBySprint[sprintId] ? this.boardsBySprint[sprintId] : [];
    return arr.filter((x: Board | null | undefined): x is Board => !!x);
  }
  // Trigger para forzar actualización de la animación
  testingAnimTrigger: { [id: number]: number } = {};
  /** Calcula el porcentaje de tiempo en pruebas respecto a la estimación (0-100+) */
  getTestingPercent(item: Board): number {
    if (item.state !== 'En pruebas' || !item.in_testing_age || !item.estimate) return 0;
    const start = new Date(item.in_testing_age).getTime();
    if (isNaN(start)) return 0;
    const elapsedMs = Date.now() - start;
    const elapsedH = elapsedMs / (1000 * 60 * 60);
    const estimateH = Number(item.estimate);
    if (!estimateH || estimateH <= 0) return 0;
    const percent = Math.round((elapsedH / estimateH) * 100);
    return percent > 999 ? 999 : percent;
  }
  refreshBoardsBySprint(sprintId: number): void {
    this.loadingBoards[sprintId] = true;
    this.qaItemsService.getBoardsBySprintId(sprintId).subscribe({
      next: (boards: Board[]) => {
        this.boardsBySprint[sprintId] = boards;
        this.loadingBoards[sprintId] = false;
      },
      error: (error: any) => {
        this.loadingBoards[sprintId] = false;
        console.error('Error loading boards for sprint', sprintId, error);
      }
    });
  }
  /**
   * Devuelve la clase de fondo para una fila según el estado y la edad de la tarea (created_at)
   */
  getRowAgeClass(item: Board): string {
    if (item.state !== 'Sin iniciar' || !item.created_at) return '';
    const created = new Date(item.created_at);
    if (isNaN(created.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 5) return '';
    if (diffHours >= 5 && diffHours < 8) return 'row-age-amber';
    if (diffHours >= 8 && diffHours < 13) return 'row-age-orange';
    if (diffHours >= 13) return 'row-age-red';
    return '';
  }
  // Almacena el tiempo calculado por id de tarea
  testingTimeCache: { [id: number]: string } = {};

  calcularTiempoEnPruebas(item: Board): void {
    if (!item.in_testing_age) {
      this.testingTimeCache[item.id!] = '';
      return;
    }
    const start = new Date(item.in_testing_age).getTime();
    if (isNaN(start)) {
      this.testingTimeCache[item.id!] = '';
      return;
    }
    let diff = Math.floor((Date.now() - start) / 1000); // en segundos
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / 86400);
    diff = diff % 86400;
    const hours = Math.floor(diff / 3600);
    diff = diff % 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    if (days > 0) {
      this.testingTimeCache[item.id!] = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.testingTimeCache[item.id!] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    // Forzar actualización de la animación
    this.testingAnimTrigger[item.id!] = (this.testingAnimTrigger[item.id!] || 0) + 1;
    // Forzar actualización visual de la pill
    // (Angular ya refresca la vista al actualizar testingTimeCache)
  }
  exportSprintToExcel(sprintData: SprintWithBoards): void {
    const data = sprintData.boards.map(item => ({
      'Tarea': item.name,
      'Casos': item.test_cases,
      'Desarrollador': this.devUsers.find(dev => dev.id === item.developer_id)?.name || '',
      'Estado': item.state,
      'Sprint': sprintData.sprint_name,
      'Devoluciones': item.returns,
      'Fecha Devolución': item.return_date,
      'Casos Automatizados': item.automated_cases
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sprint');
    XLSX.writeFile(wb, `Sprint_${sprintData.sprint_name || sprintData.sprint_id}.xlsx`);
  }
  // Eliminado: declaración duplicada fuera de la clase
  pendingBoardToCreate: Board | null = null;
  showDuplicateAutomatedModal = false;
  
  // Modal para tareas duplicadas en base de datos
  showDuplicateTaskModal = false;
  duplicateTaskInfo: any = null;
  
  // Filtro global de tareas
  taskFilter: string = '';
  // Filtro por desarrollador
  developerFilter: string = '';

  get filteredSprintsWithBoards(): SprintWithBoards[] {
    const nameFilter = this.taskFilter.trim().toLowerCase();
    const devFilter = this.developerFilter;
    // Si no hay filtros, retorna todo
    if (!nameFilter && !devFilter) return this.sprintsWithBoards;
    return this.sprintsWithBoards
      .map(sprint => ({
        ...sprint,
        boards: sprint.boards.filter(item => {
          const matchName = !nameFilter || item.name?.toLowerCase().includes(nameFilter);
          const matchDev = !devFilter || (item.developer_id && item.developer_id.toString() === devFilter);
          return matchName && matchDev;
        })
      }))
      .filter(sprint => sprint.boards.length > 0);
  }
  items: Board[] = [];
  sprints: Sprint[] = [];
  sprintsWithBoards: SprintWithBoards[] = [];
  boardsBySprint: { [sprintId: number]: Board[] } = {};
  loadingBoards: { [sprintId: number]: boolean } = {};

  // Estado de colapso para cada sprint (por id)
  sprintCollapse: { [sprintId: number]: boolean } = {};

  // Collapse para el formulario de crear sprint
  createSprintCollapse = false;
  toggleCreateSprintCollapse(): void {
    this.createSprintCollapse = !this.createSprintCollapse;
  }

  // Collapse para el formulario de crear tarea
  createTareaCollapse = false;
  toggleCreateTareaCollapse(): void {
    this.createTareaCollapse = !this.createTareaCollapse;
  }

  newItem: Board = {
    name: '',
    test_cases: 0,
    developer_id: null,
    state: 'En pruebas',
    sprint_id: null,
    sprint_prev: null,
    returns: 0,
    return_date: '',
    automated_cases: 0
  };

  newSprint: Sprint = {
    name: '',
    start_date: '',
    finish_date: ''
  };

  editingItem: Board | null = null;
  editingSprint: Sprint | null = null;

  loading = false;
  error = '';
  private errorTimeout: any;
  viewMode: 'list' | 'sprints' = 'sprints';

  isSprintPrevYes(val: any): boolean {
    return val === 1 || val === '1' || val === true || val === 'true';
  }

  devUsers: User[] = [];
  qaUsers: User[] = [];

  constructor(
    private qaItemsService: QaItemsService,
    private automatedTasksService: AutomatedTasksService,
    public authService: AuthService,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.loadSprints();
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.devUsers = users.filter(u => u.user_role === 'DEV' || u.email === 'camilo.soto@oncredit.com.co');
        this.qaUsers = users.filter(u => u.user_role === 'QA');
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  /** Helpers */
  private mapSprintFromAny(src: Sprint | SprintWithBoards): Sprint {
    const isWithBoards = (s: any): s is SprintWithBoards => 'sprint_id' in s || 'sprint_name' in s;
    if (isWithBoards(src as any)) {
      const s = src as SprintWithBoards;
      return {
        id: s.sprint_id,
        name: s.sprint_name,
        start_date: s.start_date ?? '',
        finish_date: s.finish_date ?? ''
      };
    }
    return src as Sprint;
  }

  trackById(_i: number, x: { id?: number }) {
    return x?.id ?? _i;
  }

  /** Loads */
  loadItems(): void {
    this.loading = true;
    this.qaItemsService.getItems().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al cargar los items');
        this.loading = false;
        console.error('Error loading items:', error);
      }
    });
  }

  loadSprints(): void {
    this.qaItemsService.getSprints().subscribe({
      next: (sprints) => {
        this.sprints = sprints;
        // Inicializar colapsos cerrados
        this.sprintCollapse = {};
        sprints.forEach(sprint => {
          if (sprint.id !== undefined) {
            this.sprintCollapse[sprint.id] = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading sprints:', error);
      }
    });
  }

  loadBoardsBySprint(): void {
    this.qaItemsService.getBoardsBySprint().subscribe({
      next: (sprintsWithBoards) => {
        this.sprintsWithBoards = sprintsWithBoards;
        // Inicializar colapsos para nuevos sprints
        this.sprintsWithBoards.forEach(sprint => {
          if (sprint.sprint_id !== undefined && this.sprintCollapse[sprint.sprint_id] === undefined) {
            this.sprintCollapse[sprint.sprint_id] = true; // abiertos por defecto
          }
        });
          // Cerrar todos los colapsables por defecto
          this.sprintCollapse = {};
          for (const sprint of sprintsWithBoards) {
            this.sprintCollapse[sprint.sprint_id] = false;
          }
      },
      error: (error) => {
        console.error('Error loading boards by sprint:', error);
      }
    });
  }
  /** Collapse/Expand Sprint */
  toggleSprintCollapse(sprintId: number): void {
    const wasOpen = this.sprintCollapse[sprintId];
    this.sprintCollapse[sprintId] = !wasOpen;
    if (!wasOpen && !this.boardsBySprint[sprintId]) {
      this.loadingBoards[sprintId] = true;
      this.qaItemsService.getBoardsBySprintId(sprintId).subscribe({
        next: (boards: Board[]) => {
          this.boardsBySprint[sprintId] = boards;
          this.loadingBoards[sprintId] = false;
        },
        error: (error: any) => {
          this.loadingBoards[sprintId] = false;
          console.error('Error loading boards for sprint', sprintId, error);
        }
      });
    }
  }

  /** Items CRUD */
  createItem(ignoreAutomatedCheck: boolean = false, ignoreDuplicateCheck: boolean = false): void {
    if (!this.newItem.name.trim()) {
      this.setError('El nombre es requerido');
      return;
    }

    // 1. Verificar si el nombre existe en automated_tasks
    this.automatedTasksService.getAll().subscribe({
      next: (tasks) => {
        const exists = tasks.some(t => t.task_name.trim().toLowerCase() === this.newItem.name.trim().toLowerCase());
        if (exists && !ignoreAutomatedCheck) {
          this.showDuplicateAutomatedModal = true;
          this.pendingBoardToCreate = { ...this.newItem };
          return;
        }

        // 2. Verificar si la tarea ya existe en la base de datos
        if (!ignoreDuplicateCheck) {
          this.qaItemsService.checkDuplicateTask(this.newItem.name.trim()).subscribe({
            next: (response) => {
              if (response.exists) {
                this.duplicateTaskInfo = response.task;
                this.showDuplicateTaskModal = true;
                this.pendingBoardToCreate = { ...this.newItem };
                return;
              }
              // No hay duplicados, proceder con la creación
              this.proceedWithCreation();
            },
            error: () => {
              // Si falla la verificación, proceder con la creación
              this.proceedWithCreation();
            }
          });
        } else {
          // Saltar verificación de duplicados
          this.proceedWithCreation();
        }
      },
      error: () => {
        // Si falla la consulta de automated tasks, verificar duplicados en boards
        if (!ignoreDuplicateCheck) {
          this.qaItemsService.checkDuplicateTask(this.newItem.name.trim()).subscribe({
            next: (response) => {
              if (response.exists) {
                this.duplicateTaskInfo = response.task;
                this.showDuplicateTaskModal = true;
                this.pendingBoardToCreate = { ...this.newItem };
                return;
              }
              this.proceedWithCreation();
            },
            error: () => {
              this.proceedWithCreation();
            }
          });
        } else {
          this.proceedWithCreation();
        }
      }
    });
  }

  private proceedWithCreation(): void {
    this.loading = true;
    this.qaItemsService.createItem(this.newItem).subscribe({
      next: () => {
        this.resetNewItem();
        this.loadItems();
        this.loadBoardsBySprint();
        this.error = '';
        this.loading = false;
        this.pendingBoardToCreate = null;
      },
      error: (error) => {
        this.setError('Error al crear el item');
        this.loading = false;
        console.error('Error creating item:', error);
      }
    });
  }

  confirmDuplicateAutomatedModal() {
    this.showDuplicateAutomatedModal = false;
    if (this.pendingBoardToCreate) {
      // Verificar duplicados antes de crear
      this.qaItemsService.checkDuplicateTask(this.pendingBoardToCreate.name.trim()).subscribe({
        next: (response) => {
          if (response.exists) {
            this.duplicateTaskInfo = response.task;
            this.showDuplicateTaskModal = true;
            return;
          }
          // No hay duplicados, proceder con la creación
          this.createItem(true, true);
        },
        error: () => {
          // Si falla la verificación, proceder con la creación
          this.createItem(true, true);
        }
      });
    }
  }
  closeDuplicateAutomatedModal() {
    this.showDuplicateAutomatedModal = false;
    this.pendingBoardToCreate = null;
  }

  // Métodos para manejar el modal de tareas duplicadas
  confirmDuplicateTaskModal() {
    this.showDuplicateTaskModal = false;
    if (this.pendingBoardToCreate) {
      // Forzar la creación ignorando tanto automated tasks como duplicados
      this.createItem(true, true);
    }
  }

  closeDuplicateTaskModal() {
    this.showDuplicateTaskModal = false;
    this.pendingBoardToCreate = null;
    this.duplicateTaskInfo = null;
  }

  updateItem(item: Board | null): void {
    if (!item || !item.id) return;
    // Si el estado cambió a 'Devuelta', poner la fecha actual
    if (item.state === 'Devuelta') {
      item.return_date = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    }
    // Si el estado cambió a 'En pruebas', asignar el QA actual (owner_id) al usuario logueado
    if (item.state === 'En pruebas') {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && item.owner_id !== currentUser.id) {
        item.owner_id = currentUser.id;
      }
    }
    this.loading = true;
    this.qaItemsService.updateItem(item.id, item).subscribe({
      next: () => {
        this.editingItem = null;
        // Refresca solo el sprint correspondiente
        if (item.sprint_id) {
          this.loadingBoards[item.sprint_id] = true;
          this.qaItemsService.getBoardsBySprintId(item.sprint_id).subscribe({
            next: (boards: Board[]) => {
              this.boardsBySprint[item.sprint_id!] = boards;
              this.loadingBoards[item.sprint_id!] = false;
            },
            error: (error: any) => {
              this.loadingBoards[item.sprint_id!] = false;
              console.error('Error loading boards for sprint', item.sprint_id, error);
            }
          });
        }
        this.error = '';
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al actualizar el item');
        this.loading = false;
        console.error('Error updating item:', error);
      }
    });
  }

  deleteItem(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return;
    this.loading = true;
    this.qaItemsService.deleteItem(id).subscribe({
      next: () => {
        // 🔁 refresca ambas vistas
        this.loadItems();
        this.loadBoardsBySprint();
        this.error = '';
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al eliminar el item');
        this.loading = false;
        console.error('Error deleting item:', error);
      }
    });
  }

  startEdit(item: Board): void {
    this.editingItem = { ...item };
  }

  cancelEdit(): void {
    this.editingItem = null;
  }

  resetNewItem(): void {
    this.newItem = {
      name: '',
      test_cases: null,
      developer_id: null,
      state: 'Sin iniciar',
      sprint_id: null,
      returns: 0,
      return_date: '',
      automated_cases: 0
    };
  }

  /** Sprints CRUD */
  createSprint(): void {
    if (!this.newSprint.name.trim()) {
      this.setError('El nombre del sprint es requerido');
      return;
    }
    this.loading = true;
    this.qaItemsService.createSprint(this.newSprint).subscribe({
      next: () => {
        this.resetNewSprint();
        this.loadSprints();
        this.loadBoardsBySprint();
        this.error = '';
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al crear el sprint');
        this.loading = false;
        console.error('Error creating sprint:', error);
      }
    });
  }

  updateSprint(sprint: Sprint): void {
    if (!sprint.id) return;
    this.loading = true;
    this.qaItemsService.updateSprint(sprint.id, sprint).subscribe({
      next: () => {
        this.editingSprint = null;
        this.loadSprints();
        this.loadBoardsBySprint();
        this.error = '';
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al actualizar el sprint');
        this.loading = false;
        console.error('Error updating sprint:', error);
      }
    });
  }

  deleteSprint(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este sprint?')) return;
    this.loading = true;
    this.qaItemsService.deleteSprint(id).subscribe({
      next: () => {
        this.loadSprints();
        this.loadBoardsBySprint();
        this.error = '';
        this.loading = false;
      },
      error: (error) => {
        this.setError('Error al eliminar el sprint');
        this.loading = false;
        console.error('Error deleting sprint:', error);
      }
    });
  }
  /** Utilidad para mostrar error solo 2 segundos */
  setError(msg: string) {
    this.error = msg;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => {
      this.error = '';
    }, 2000);
  }

  startEditSprint(sprint: Sprint | SprintWithBoards): void {
    // acepta sprintData (SprintWithBoards) o un Sprint normal
    const s = this.mapSprintFromAny(sprint);
    this.editingSprint = { ...s };
  }

  cancelEditSprint(): void {
    this.editingSprint = null;
  }

  resetNewSprint(): void {
    this.newSprint = {
      name: '',
      start_date: '',
      finish_date: ''
    };
  }

  /** Misc */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'sprints' : 'list';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
