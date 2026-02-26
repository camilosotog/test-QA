import { Component, OnInit } from '@angular/core';
import { BugsService, Bug } from '../../core/bugs.service';
import { AuthService } from '../../core/auth.service';
import { UsersService, User } from '../../core/users.service';
import { QaItemsService, Sprint } from '../../core/qa-items.service';

@Component({
  selector: 'app-bugs',
  templateUrl: './bugs.component.html',
  styleUrls: ['./bugs.component.scss']
})
export class BugsComponent implements OnInit {
  bugs: Bug[] = [];
  bugsByMonth: any[] = [];
  users: User[] = [];
  sprints: Sprint[] = [];
  form: Partial<Bug> = { title: '', description: '', type: '', priority: '', severity: '' };
  editingId: number | null = null;
  monthCollapse: { [key: string]: boolean } = {};
  monthLoading: { [key: string]: boolean } = {}; // Para indicador de carga

  constructor(private bugsService: BugsService, private authService: AuthService, private usersService: UsersService, private qaItemsService: QaItemsService) {}
  

  ngOnInit() { this.load(); }

  async loadUsers() {
    this.usersService.getUsers().subscribe((u: User[]) => {
      // Mostrar solo usuarios con rol ADMIN o QA
      this.users = (u || []).filter(x => (x as any).user_role === 'ADMIN' || (x as any).user_role === 'QA');
      const current = this.authService.getCurrentUser();
      if (current && current.id) {
        // si no se ha seteado reporter, usar current user
        if (!this.form.reporter_id) this.form.reporter_id = current.id;
      }
    });
  }

  loadSprints() {
    this.qaItemsService.getSprints().subscribe({
      next: (s) => this.sprints = s || [],
      error: (err) => console.error('Error loading sprints', err)
    });
  }

  load() {
    // Cargar solo resumen de meses (sin bugs) - lazy loading
    this.bugsService.getMonthsSummary().subscribe(
      (data: any[]) => {
        this.bugsByMonth = data;
        // Inicializar collapse - todos CERRADOS por defecto
        this.bugsByMonth.forEach((month) => {
          if (!this.monthCollapse.hasOwnProperty(month.monthKey)) {
            this.monthCollapse[month.monthKey] = false; // cerrado
          }
        });
      },
      (err: any) => console.error('Error loading months summary', err)
    );
    this.loadUsers();
    this.loadSprints();
  }

  toggleMonthCollapse(monthKey: string): void {
    const isCurrentlyOpen = this.monthCollapse[monthKey];
    
    if (!isCurrentlyOpen) {
      // Va a abrir - cargar bugs si no están cargados
      const monthData = this.bugsByMonth.find(m => m.monthKey === monthKey);
      if (monthData && !monthData.loaded) {
        this.monthLoading[monthKey] = true; // Mostrar indicador de carga
        this.bugsService.getBugsByMonth(monthKey).subscribe(
          (bugs: any[]) => {
            monthData.bugs = bugs;
            monthData.loaded = true;
            this.monthLoading[monthKey] = false;
            this.monthCollapse[monthKey] = true; // abrir después de cargar
          },
          (err: any) => {
            console.error('Error loading bugs for month', monthKey, err);
            this.monthLoading[monthKey] = false;
          }
        );
        return; // No cambiar estado hasta que cargue
      }
    }
    
    this.monthCollapse[monthKey] = !isCurrentlyOpen;
  }

  loadAndScroll() {
    // Obtener el mes actual para abrirlo después de crear bug
    const now = new Date();
    const currentMonthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    this.bugsService.getMonthsSummary().subscribe(
      (data: any[]) => {
        this.bugsByMonth = data;
        // Inicializar todos cerrados
        this.bugsByMonth.forEach((month) => {
          this.monthCollapse[month.monthKey] = false;
        });
        
        // Abrir y cargar el mes actual
        const currentMonth = this.bugsByMonth.find(m => m.monthKey === currentMonthKey);
        if (currentMonth) {
          this.bugsService.getBugsByMonth(currentMonthKey).subscribe(
            (bugs: any[]) => {
              currentMonth.bugs = bugs;
              currentMonth.loaded = true;
              this.monthCollapse[currentMonthKey] = true;
              // Scroll después de cargar
              setTimeout(() => {
                const element = document.querySelector('.card-header');
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          );
        }
      },
      (err: any) => console.error('Error loading months summary', err)
    );
    this.loadUsers();
    this.loadSprints();
  }

  save() {
    if (!this.form.title) return alert('El título es requerido');
    // Validaciones adicionales
    if (!this.form.priority) return alert('Selecciona una prioridad');
    if (!this.form.severity) return alert('Selecciona una severidad');
  // Normalizar a mayúsculas y eliminar tildes para comparar
  const normalize = (s?: string) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
  const allowedPriority = ['BAJA','MEDIA','ALTA'];
  const allowedSeverity = ['NO CRITICO','CRITICO'];
  const payload = { ...this.form } as any;
  const pNorm = normalize(payload.priority);
  const sNorm = normalize(payload.severity);
  if (!pNorm || !allowedPriority.includes(pNorm)) return alert('Prioridad inválida');
  if (!sNorm || !allowedSeverity.includes(sNorm)) return alert('Severidad inválida');
  payload.priority = pNorm;
  payload.severity = sNorm;

    // asignar reporter_id desde auth solo si el usuario NO seleccionó un reporter en el select
    const current = this.authService.getCurrentUser();
    if ((!payload.reporter_id || payload.reporter_id === null) && current && current.id) {
      payload.reporter_id = current.id;
    }
  // debug: mostrar payload antes de enviar
  console.debug('Bugs payload:', payload);
    if (this.editingId) {
      this.bugsService.update(this.editingId, payload).subscribe(
        () => { 
          alert('✅ Bug actualizado exitosamente');
          this.cancel(); 
          this.loadAndScroll();
        }, 
        (err: any) => this.showError(err)
      );
    } else {
      this.bugsService.create(payload).subscribe(
        () => { 
          alert('✅ Bug creado exitosamente');
          this.cancel(); 
          this.loadAndScroll();
        }, 
        (err: any) => this.showError(err)
      );
    }
  }

  showError(err: any) {
    const msg = err?.error?.details || err?.error?.error || JSON.stringify(err?.error) || 'Error desconocido';
    alert('Error creando bug: ' + msg);
    console.error('Error response', err);
  }

  edit(b: Bug) { this.editingId = b.id || null; this.form = { ...b }; }

  cancel() { this.editingId = null; this.form = { title: '', description: '', type: '', priority: '', severity: '' }; }

  isCritical(b: Bug) {
    const raw = (b && (b.severity || '')) as string;
    if (!raw) return false;
    // Normalize: remove diacritics and make upper-case
    let s = raw.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    // If explicitly contains a 'NO' token (e.g. 'NO CRITICO') treat as non-critical
    if (/\bNO\b/.test(s)) return false;
    // Match common critical words in Spanish/English
    return /CRITIC/.test(s) || /CRITICO/.test(s) || /CRITICAL/.test(s);
  }

  isExternalUrl(text?: string) {
    if (!text) return false;
    try {
      const t = text.trim();
      return t.startsWith('http://') || t.startsWith('https://');
    } catch (e) { return false; }
  }

  remove(id?: number) { if (!id) return; if (!confirm('Eliminar bug?')) return; this.bugsService.delete(id).subscribe(() => this.load()); }
}
