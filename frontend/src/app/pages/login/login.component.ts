import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  // Propiedades para mostrar imagen de usuario
  showUserImage: boolean = false;
  userImage: string = '';
  detectedUser: string = '';
  userGreeting: string = '';

  // Mapeo de usuarios conocidos
  knownUsers: { [key: string]: { name: string; greeting: string; image: string } } = {
    'luis': { name: 'Pipe', greeting: 'Hola Pipe', image: 'assets/pipe_cara.png' },
    'pipe': { name: 'Pipe', greeting: 'Hola Pipe', image: 'assets/pipe_cara.png' },
    'juanse': { name: 'Sebas', greeting: 'Hola Sebas', image: 'assets/sebas_cara2.png' },
    'sebastian': { name: 'Sebas', greeting: 'Hola Sebas', image: 'assets/sebas_cara2.png' },
    'sebas': { name: 'Sebas', greeting: 'Hola Sebas', image: 'assets/sebas_cara2.png' },
    'camilo': { name: 'Cami', greeting: 'Hola Cami', image: 'assets/cami_cara.png' },
    'cami': { name: 'Cami', greeting: 'Hola Cami', image: 'assets/cami_cara.png' },
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onEmailInput(value: string): void {
    const emailPrefix = value.toLowerCase().split('@')[0];
    
    // Detectar usuario cuando tenga al menos 3 caracteres
    if (emailPrefix.length >= 3) {
      const lowerEmail = emailPrefix.toLowerCase();
      
      // Buscar coincidencia en usuarios conocidos
      for (const key in this.knownUsers) {
        if (lowerEmail.includes(key)) {
          this.detectedUser = this.knownUsers[key].name;
          this.userGreeting = this.knownUsers[key].greeting;
          this.userImage = this.knownUsers[key].image;
          this.showUserImage = true;
          return;
        }
      }
    }
    
    // Si no hay coincidencia, ocultar imagen
    this.showUserImage = false;
    this.detectedUser = '';
    this.userGreeting = '';
    this.userImage = '';
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);
        this.router.navigate(['/qa-items']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Error al iniciar sesión';
      }
    });
  }

  
}
