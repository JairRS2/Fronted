import { Component, OnInit , HostListener} from '@angular/core';
import { AuthService } from './services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Catalago';
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    window.onpopstate = (event) => {
      if (!this.authService.isLoggedIn()) {
        // Si no está autenticado, redirige al login
        this.router.navigate(['/login']);
      }
    };
  }
   // Escucha el evento 'beforeunload'
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    // Verifica si el usuario está navegando fuera del dominio de la aplicación
    if (!this.isReload()) {
      this.authService.logout(); // Limpia la sesión
    }
  }

  // Comprueba si el usuario está recargando la página
  private isReload(): boolean {
    return performance
      .getEntriesByType('navigation')
      .some((entry: any) => entry.type === 'reload');
  }
}
