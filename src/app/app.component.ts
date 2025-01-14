import { Component, OnInit } from '@angular/core';
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
}
