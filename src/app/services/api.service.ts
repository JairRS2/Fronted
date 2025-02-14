import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.baseUrl; // URL de la API REST dinamica
  private currentUser: { nombre: string; role: string } | null = null;

  constructor(private http: HttpClient) { }

  // Guardar usuario actual
  setCurrentUser(user: { nombre: string; role: string }): void {
    this.currentUser = user;
  }

  // Obtener usuario actual
  getCurrentUser(): { nombre: string; role: string } | null {
    return this.currentUser;
  }

  // Obtener productos
  getProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products`).pipe(
      catchError((error) => {
        console.error('Error al obtener productos:', error);
        return throwError(error);  // Lanza el error para que el componente pueda manejarlo
      })
    );
  }
  
  uploadImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image, image.name);
  
    return this.http.post(`${this.baseUrl}/upload`, formData).pipe(
      catchError((error) => {
        console.error('Error al cargar la imagen:', error);
        return throwError(error);
      })
    );
  }

  //Obtener Detalles de Vales
  getValesDetalles(productId: string, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams().set('productId', productId);

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    // Agregar console.log para verificar los parámetros
    console.log(`URL final: ${this.baseUrl}/ValesDetalles/${productId}?${params.toString()}`);

    return this.http.get<any>(`${this.baseUrl}/ValesDetalles/${productId}`, { params });
  }

  //obtener vale
  getVale(nNumVal: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vales/${nNumVal}`).pipe(
      catchError((error) => {
        console.error('Error al obtener el Vale:', error);
        return throwError(error);
      })
    );
  }

  // Método para obtener los detalles del kardex
  getKardexDetails(productId: string, startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams().set('productId', productId);

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<any>(`${this.baseUrl}/Kardex/${productId}`, { params });
  }

  // Método para obtener los detalles del kardex
  getComprasDetails(productId: string, startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams().set('productId', productId);

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<any>(`${this.baseUrl}/OrdenDetalles/${productId}`, { params });
  }

  // Crear producto
  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, product);
  }

  // Actualizar producto
  updateProduct(product: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${product.cCodPrd}`, product);
  }

  // Obtener proveedores
  getProveedores(): Observable<any> {
    return this.http.get(`${this.baseUrl}/proveedores`);
  }

  // Obtener Lineas
  getLineas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/lineas`);
  }

  // Obtener medidas
  getMedidas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/medidas`);
  }

  // Login de usuario
  loginUsuario(credentials: {
    cClaveEmpleado: string;
    cClaveUsuario: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, credentials).pipe(
      catchError((error) => {
        console.error('Error en el inicio de sesión:', error);
        return throwError(error);
      })
    );
  }

  //Serivicio para eliminar un producto
  deleteProduct(cCodPrd: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${cCodPrd}`);
  }

  //Servicio para habilitar un producto
  habilitarProducto(cCodPrd: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/productos/habilitar/${cCodPrd}`, {});
  }

  //Servicio para deshabilitar un producto
  deshabilitarProducto(cCodPrd: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/productos/deshabilitar/${cCodPrd}`, {});
  }


}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userDetailsSubject = new BehaviorSubject<any>(null);
  public userDetails$ = this.userDetailsSubject.asObservable();

  constructor() {
    // Al cargar el servicio, verificar si ya existe un usuario en el sessionStorage
    const storedUserDetails = sessionStorage.getItem('userDetails');
    if (storedUserDetails) {
      this.userDetailsSubject.next(JSON.parse(storedUserDetails));
    }
  }

  // Guarda los detalles del usuario en sessionStorage y en el BehaviorSubject
  setUserDetails(userDetails: any) {
    sessionStorage.setItem('userDetails', JSON.stringify(userDetails)); // Guarda en sessionStorage
    this.userDetailsSubject.next(userDetails); // Actualiza el BehaviorSubject
  }

  // Devuelve los detalles del usuario
  getUserDetails() {
    return this.userDetailsSubject.value;
  }

  // Método para verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    return this.getUserDetails() !== null; // Verifica si los detalles del usuario existen
  }

  // Método de logout
  logout() {
    sessionStorage.removeItem('userDetails'); // Elimina los detalles del usuario de sessionStorage
    this.userDetailsSubject.next(null); // Elimina los detalles del usuario del BehaviorSubject
  }
}



