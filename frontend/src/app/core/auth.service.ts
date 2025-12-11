import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private authStatusSubject = new Subject<void>();
  authStatusChanged = this.authStatusSubject.asObservable();

  private socket!: ReturnType<typeof io>;

  constructor(private http: HttpClient, private router: Router) {
    // conecta con tu backend socket.io usando ruta relativa (usa el proxy)
    try {
      this.socket = io('/', { path: '/socket.io', reconnection: true, reconnectionDelay: 1000 });

      // escucha el evento de logout forzado
      this.socket.on('forceLogout', () => {
        this.forceLogout();
      });

      // Log de conexión
      this.socket.on('connect', () => {
        console.log('Socket.io conectado');
      });

      this.socket.on('connect_error', (error: any) => {
        console.warn('Error en conexión Socket.io:', error);
      });
    } catch (error) {
      console.warn('Error inicializando Socket.io:', error);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password });
  }

  register(email: string, name: string, password: string, role?: string): Observable<any> {
    return this.http.post('/api/auth/register', { email, name, password, user_role: role });
  }

  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.authStatusSubject.next();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    const user = this.getCurrentUser();
    if (user && user.id) {
      this.http.post('/api/auth/logout', { id: user.id }).subscribe({
        complete: () => {
          this.forceLogout();
        }
      });
    } else {
      this.forceLogout();
    }
  }

  forceLogout(): void {
    localStorage.removeItem(this.tokenKey);
    this.authStatusSubject.next();
    this.router.navigate(['/login']); // 👈 ahora usa Router en vez de window.location.href
  }

  /** 🔴 Llamada al backend para cerrar sesión de todos */
  logoutAll(): Observable<any> {
    return this.http.post('/api/auth/logout-all', {});
  }

  /** 🔥 Exponer el socket para escuchar eventos personalizados */
  getSocket(): ReturnType<typeof io> {
    return this.socket;
  }
}
