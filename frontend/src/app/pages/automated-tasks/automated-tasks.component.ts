// Eliminado: declaración duplicada fuera de la clase
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutomatedTasksService, AutomatedTask } from '../../core/automated-tasks.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-automated-tasks',
  templateUrl: './automated-tasks.component.html',
  styleUrls: ['./automated-tasks.component.scss']
})
export class AutomatedTasksComponent implements OnInit {
  tasksByQA: { [qa: string]: AutomatedTask[] } = {};
  showDuplicateModal = false;
  tasks: AutomatedTask[] = [];
  form: FormGroup;
  editForm: FormGroup;
  editingTask: AutomatedTask | null = null;
  taskToDelete: AutomatedTask | null = null;
  loading = false;
  error: string | null = null;
  qaExpanded: boolean[] = [];
  createExpanded: boolean = false;

  constructor(
    private fb: FormBuilder,
    private tasksService: AutomatedTasksService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      task_name: ['', Validators.required],
      state: ['', Validators.required],
      qa: ['']
    });
    this.editForm = this.fb.group({
      task_name: ['', Validators.required],
      state: ['', Validators.required],
      qa: ['']
    });
  }
  startEditTask(task: AutomatedTask) {
    this.editingTask = task;
    this.editForm.setValue({
      task_name: task.task_name,
      state: task.state,
      qa: task.qa || ''
    });
  }

  saveEditTask() {
    if (!this.editingTask || this.editForm.invalid) return;
    this.loading = true;
    const updated = {
      ...this.editingTask,
      ...this.editForm.value
    };
    this.tasksService.update(updated).subscribe({
      next: () => {
        this.editingTask = null;
        this.loadTasks();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al editar tarea';
        this.loading = false;
      }
    });
  }

  cancelEditTask() {
    this.editingTask = null;
  }

  confirmDeleteTask(task: AutomatedTask) {
    this.taskToDelete = task;
  }

  cancelDeleteTask() {
    this.taskToDelete = null;
  }

  deleteTask() {
    if (!this.taskToDelete) return;
    this.loading = true;
    this.tasksService.delete(this.taskToDelete.id!).subscribe({
      next: () => {
        this.taskToDelete = null;
        this.loadTasks();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al eliminar tarea';
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
  this.loadTasks();
  }

  get isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return user && user.role === 'ADMIN';
  }

  loadTasks() {
    this.loading = true;
    this.tasksService.getAll().subscribe({
      next: (tasks: AutomatedTask[]) => {
        this.tasks = tasks;
        // Agrupar tareas por QA
        this.tasksByQA = {};
    this.qaExpanded = [];
        for (const task of tasks) {
          const qa = task.qa || 'Sin QA';
          if (!this.tasksByQA[qa]) this.tasksByQA[qa] = [];
          this.tasksByQA[qa].push(task);
        }
    // Inicializar el estado de los colapsables
    const qaKeys = Object.keys(this.tasksByQA);
    this.qaExpanded = qaKeys.map(() => false);
        this.loading = false;
      },
      error: (err: any) => { this.error = 'Error al cargar tareas'; this.loading = false; }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const taskName = this.form.value.task_name.trim().toUpperCase();
    const exists = this.tasks.some(t => t.task_name.trim().toUpperCase() === taskName);
    if (exists) {
      this.showDuplicateModal = true;
      return;
    }
    this.loading = true;
    this.tasksService.create({
      task_name: this.form.value.task_name,
      state: this.form.value.state,
      qa: this.form.value.qa
    }).subscribe({
      next: () => { this.form.reset(); this.loadTasks(); },
      error: (err: any) => {
        if (err.status === 409) {
          this.showDuplicateModal = true;
        } else {
          this.error = 'Error al agregar tarea';
        }
        this.loading = false;
      }
    });
  }

  closeDuplicateModal() {
    this.showDuplicateModal = false;
  }
  
}
