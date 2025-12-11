import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser?.();
    if (user && (user.user_role === 'ADMIN' || user.role === 'ADMIN')) {
      return true;
    }
    this.router.navigate(['/qa-items']);
    return false;
  }
}
