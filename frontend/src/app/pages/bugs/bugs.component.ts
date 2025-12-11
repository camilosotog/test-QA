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
  users: User[] = [];
  sprints: Sprint[] = [];
  form: Partial<Bug> = { title: '', description: '', type: '', priority: '', severity: '' };
  editingId: number | null = null;

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
    this.bugsService.list().subscribe(b => this.bugs = b);
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
      this.bugsService.update(this.editingId, payload).subscribe(() => { this.cancel(); this.load(); }, (err: any) => this.showError(err));
    } else {
      this.bugsService.create(payload).subscribe(() => { this.cancel(); this.load(); }, (err: any) => this.showError(err));
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
