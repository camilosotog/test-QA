import { Component, OnInit } from '@angular/core';
import { UsersService, User } from '../../core/users.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';
  editingUser: User | null = null;
  newUser: User = { email: '', name: '', password: '', user_role: 'user', avatarUrl: '' };
  creating = false;

  canView = false;
  userEmail = '';
  userRole = '';


  private errorTimeout: any;

  setError(msg: string) {
    this.error = msg;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => {
      this.error = '';
    }, 2000);
  }

  constructor(private usersService: UsersService, private authService: AuthService) {}

  ngOnInit() {
    // Obtener datos del usuario desde el token
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userEmail = payload.email || '';
        this.userRole = payload.user_role || payload.role || '';
        if (this.userEmail === 'camilo.soto@oncredit.com.co' || this.userRole === 'ADMIN') {
          this.canView = true;
          this.fetchUsers();
        }
      } catch (e) {
        this.canView = false;
      }
    }
  }

  fetchUsers() {
    this.loading = true;
    this.usersService.getUsers().subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: err => { this.error = 'Error al cargar usuarios'; this.loading = false; }
    });
  }

  startEdit(user: User) {
    this.editingUser = { ...user, password: '' };
  }

  cancelEdit() {
    this.editingUser = null;
  }

  updateUser() {
    if (!this.editingUser) return;
    const { id, ...data } = this.editingUser;
    this.usersService.updateUser(id!, data as User).subscribe({
      next: () => { this.fetchUsers(); this.editingUser = null; },
      error: () => { this.error = 'Error al actualizar usuario'; }
    });
  }

  deleteUser(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    this.usersService.deleteUser(id).subscribe({
      next: () => this.fetchUsers(),
      error: () => { this.error = 'Error al eliminar usuario'; }
    });
  }

  createUser() {
    this.creating = true;
    this.usersService.createUser(this.newUser).subscribe({
      next: () => {
        this.fetchUsers();
        this.newUser = { email: '', name: '', password: '', user_role: 'user' };
        this.creating = false;
      },
  error: () => { this.setError('Error al crear usuario'); this.creating = false; }
    });
  }
}
