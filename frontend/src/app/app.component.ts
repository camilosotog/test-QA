import { Component, OnInit, OnDestroy } from '@angular/core';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { UsersService, User } from './core/users.service';
import { AuthService } from './core/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  onlineUsers: User[] = [];
  userAvatarUrl: string | null = null;
  private authSubscription: Subscription | null = null;
  private socket: ReturnType<typeof io> | null = null;
  title = 'frontend';
  sidebarOpen = true;
  userRole: string | null = null;
  userName: string | null = null;
  userEmail: string | null = null;
  showProfileModal = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private usersService: UsersService
  ) {
    this.setUserInfo();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  loadOnlineUsers() {
    this.usersService.getOnlineUsers().subscribe(users => {
      this.onlineUsers = users;
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.authStatusChanged?.subscribe(() => {
      this.setUserInfo();
      this.loadOnlineUsers();
    });

    this.loadOnlineUsers();

    this.socket = io('http://localhost:4100', {
      transports: ['websocket']
    });

    this.socket.on('onlineUsersChanged', () => {
      this.loadOnlineUsers();
    });

    this.socket.on('forceLogout', () => {
      this.authService.forceLogout();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setUserInfo() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.userRole = null;
      this.userName = null;
      this.userEmail = null;
      this.userAvatarUrl = null;
      return;
    }
    this.userRole = user.role || null;
    this.userName = user.name || user.email || null;
    this.userEmail = user.email || null;
    // Foto personalizada para Camilo
    if (this.userEmail === 'camilo.soto@oncredit.com.co') {
      this.userAvatarUrl = 'assets/512.png';
    } else if (this.userEmail === 'juanse.martinez@oncredit.com.co') {
      this.userAvatarUrl = 'assets/sebas_cara2.png';
    } else if (this.userEmail === 'andresm.reyes@oncredit.com.co') {
      this.userAvatarUrl = 'assets/mateo_cara2.png';
    } else if (this.userEmail === 'luis.lasso@oncredit.com.co') {
      this.userAvatarUrl = 'assets/pipe_cara.png';
    } else {
      this.userAvatarUrl = user.avatarUrl || null;
    }
  }

  get userInitials(): string {
    if (!this.userName) return '';
    const parts = this.userName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  openProfileModal() {
    this.showProfileModal = true;
  }
  closeProfileModal() {
    this.showProfileModal = false;
  }
  logout() {
    this.authService.logout();
    this.setUserInfo();
    this.router.navigate(['/login']);
  }

  logoutAllUsers() {
    this.authService.logoutAll().subscribe({
      next: (res) => console.log(res.message),
      error: (err) => console.error(err)
    });
  }
}
// 