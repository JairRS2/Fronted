import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/api.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  credentials = { cClaveEmpleado: '', cClaveUsuario: '' };
  // Definición de las propiedades que se utilizan en el formulario

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) { }

  //Metodo para el boton de submit para la insercion de los datos
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
        // Guardar los detalles del usuario en el AuthService
        this.authService.setUserDetails(response);
        // Mostrar mensaje dependiendo del rol
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
          this.router.navigate(['/']);
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
