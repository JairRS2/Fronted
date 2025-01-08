import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  userName: string = '';
  productForm: FormGroup;
  products: any[] = [];
  filterText: string = '';
  page = 1;
  totalPages: number = 0;
  itemsPerPage: number = 20; 
  showForm: boolean = false;
  activeSection: string = ''; 
constructor(private router:Router , private apiService:ApiService ,private fb: FormBuilder, private authService:AuthService){
  this.productForm = this.fb.group({
    cCodPrd: ['', Validators.required],
    cDesPrd: ['', Validators.required],
    nUniPrd: ['', Validators.required],
    nMinPrd: ['', Validators.required], 
    nMaxPrd: ['', Validators.required],
    dAltPrd: ['', Validators.required],
    dUltPrd: ['', Validators.required],
    nLinPrd: ['', Validators.required],
    nCosPrd: ['', Validators.required],
    nPrePrd: ['', Validators.required],
    nInvIPrd: ['', Validators.required],
    nInvAPrd: ['', Validators.required],
    nUltPrd: ['', Validators.required],
    cPosPrd: ['', Validators.required],
    cPtePrd: ['', Validators.required],
    cPrv1Prd: ['', Validators.required],
    cPrv2Prd: ['', Validators.required],
  });
}


ngOnInit(): void {
  this.activeSection = 'products'; 
    this.fetchProducts(); 
  const userDetails = this.authService.getUserDetails();
  this.userName = userDetails.nombre || 'Usuario'; // Cambiar a 'nombre'
}


showSection(section: string) {
  this.activeSection = section; // Cambia la sección activa
}


resetView() {
  this.activeSection = ''; // Restablece la vista (oculta la lista de productos)
}

//Metodo para obtener los productos
fetchProducts(): void {
  this.apiService.getProducts().subscribe(
    (data) => {
      this.products = data;
      this.page = 1; // Resetea a la primera página
      this.calculateTotalPages(); // Recalcula el total de páginas
    },
    (error) => {
      console.error('Error al obtener los productos:', error);
    }
  );
}

//metodo parafiltra los productos
filteredProducts() {
  // Filtra los productos según el filtro de texto
  const filtered = this.filterText
    ? this.products.filter((product) =>
        product.cCodPrd.toLowerCase().includes(this.filterText.toLowerCase()) ||
        product.cDesPrd.toLowerCase().includes(this.filterText.toLowerCase())
      )
    : this.products;
  // Si no hay productos, reinicia la paginación y muestra el mensaje
  if (filtered.length === 0) {
    this.page = 1; // Resetea a la primera página si no hay productos
    this.totalPages = 0; // Establece el total de páginas a 0
    return [];
  }
  // Asegúrate de que la página se mantenga dentro del rango
  const startIndex = (this.page - 1) * this.itemsPerPage;
  return filtered.slice(startIndex, startIndex + this.itemsPerPage);
}
onFilterChange() {
  // Al cambiar el filtro, reseteamos la página a la primera y recalculemos el total de páginas
  this.page = 1;
  this.calculateTotalPages(); // Recalcula el total de páginas según el nuevo filtro
}  


calculateTotalPages() {
  const filtered = this.filterText
    ? this.products.filter((product) =>
        product.cCodPrd.toLowerCase().includes(this.filterText.toLowerCase()) ||
        product.cDesPrd.toLowerCase().includes(this.filterText.toLowerCase())
      )
    : this.products;
  this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
}


changePage(page: number) {
  if (page >= 1 && page <= this.totalPages) {
    this.page = page;
    this.calculateTotalPages(); // Recalcula el total de páginas
  }
}


paginationRange(): number[] {
  const rangeSize = 5; // Número máximo de páginas visibles
  const start = Math.max(1, this.page - Math.floor(rangeSize / 2));
  const end = Math.min(this.totalPages, start + rangeSize - 1);
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}


toggleProductDetails(product: any): void {
  product.showDetails = !product.showDetails; // Expande o colapsa detalles del producto
}


logout() {
    // Aquí puedes añadir cualquier lógica adicional, como limpiar el almacenamiento local
    // Por ejemplo, para borrar datos del usuario
    this.router.navigate(['/login']); // Redirige a la página de login
  }

}
