import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/api.service'; // Correcto si están en el mismo archivo
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  credentials = { cClaveEmpleado: '', cClaveUsuario: '' };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}
  ngOnInit() {
    // Verificar si el usuario ya está autenticado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/products']); // O la ruta correspondiente para usuarios logueados
    }
  }
  
  onSubmit() {
    if (!this.credentials.cClaveEmpleado || !this.credentials.cClaveUsuario) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Vacíos',
        text: 'Por favor, proporciona ambos campos.',
      });
      return;
    }

    this.apiService.loginUsuario(this.credentials).subscribe({
      next: (response) => {
        this.authService.setUserDetails(response);

        if (response.role === 'Administrador') {
          Swal.fire({
            icon: 'success',
            title: `Bienvenido, Administrador`,
            text: `${response.nombre}`,
          });
          this.router.navigate(['/products']);
        } else if (response.role === 'Usuario') {
          Swal.fire({
            icon: 'success',
            title: `Bienvenido, Usuario`,
            text: `${response.nombre}`,
          });
          this.router.navigate(['/home']);
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Bienvenido',
            text: `${response.nombre}`,
          });
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Inicio de Sesión',
          text: err.error.message || 'Ocurrió un error inesperado.',
        });
      },
    });
  }
}
