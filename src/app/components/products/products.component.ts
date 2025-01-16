import { Component, OnInit , HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { ValesModalComponent } from 'src/app/vales-modal/vales-modal.component';
import { KardexModalComponent } from 'src/app/kardex-modal/kardex-modal.component';
import { ComprasModalComponent } from 'src/app/compras-modal/compras-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/api.service';
import Swal from 'sweetalert2';
import { ImageModalComponentComponent } from 'src/app/image-modal-component/image-modal-component.component';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  userName: string = '';//variable para almacenar el nombre del usuario
  selectedStatus: boolean | null = null;//variable para el filtrado por estado del producto
  selectedInventory: boolean | null = null;//varibale para el filtro por inventario
  activeSection: string = '';//variable para cambiar  la actividad de la section
  showProductForm: boolean = false;//variable para la visualizacion del formulario de producto
  productForm: FormGroup;//variable para el formulario
  products: any[] = [];//variable para almacenar los productos
  filterText: string = '';//variable para filtrar productos
  editingProduct: any = null;//variable para editar producto
  selectedProduct: any = null;//variable para seleccionar un producto
  page = 1;//predefinimos la pagina inicial
  totalPages: number = 0;//variable para inicializar el total de paginas
  itemsPerPage: number = 17;//Cantidad de producto a mostrar en la pagina
  showForm: boolean = false;//variable para mostrar el formulario
  modalVisible = false;//variable para que los modales sea visibles
  modalType = '';//variable para el tipo de modal
  lines: any[] = []; // se cargan dinámicamente
  selectedLine: string | null = null; // Línea seleccionada
  units: any[] = []; // se cargan dinámicamente
  selectedUnits: string = '';//varible para el filtrado por unidades de medida
  providers: any[] = [];//variable para almacenar los proveedores
  editableFields: string[] = [
    'nLinPrd',
    'cPtePrd',
    'nMaxPrd',
    'nUniPrd',
    'cPosPrd',
    'cDesPrd'
  ];//variable para habilitar los inputs editables en el formulario(actualizar)

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService

  ) {
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
      nInvIPrd:['', Validators.required],
      nInvAPrd:['', Validators.required],
      nUltPrd: ['', Validators.required],
      cPosPrd: ['', Validators.required],
      cPtePrd: ['', Validators.required],
      cPrv1Prd:['', Validators.required],
      cPrv2Prd:['', Validators.required],
      nEdoPrd: [''],
    });
  }

  //metodo para la inicializacion de la pagina
  ngOnInit(): void {
    this.activeSection = 'products';
    this.fetchProducts();
    this.loadProviders();
    this.loadLines();
    this.loadUnits();
    this.preprocessProducts();
    const userDetails = this.authService.getUserDetails();
    this.userName = userDetails.nombre || 'Usuario'; // Cambiar a 'nombre'
  }
  openImageModal(imageUrl: string): void {
    this.dialog.open(ImageModalComponentComponent, {
      data: { imageUrl }, // Pasar la URL al modal
      panelClass: 'custom-dialog-container', // Clase opcional para estilizar el modal
    });
  }
// Detectar clics fuera de la fila para cerrar los detalles
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const clickedElement = event.target as HTMLElement;

  // Verifica si el clic fue fuera de cualquier fila de producto
  if (!clickedElement.closest('tr,button,mat-label')) {
    // Cierra todos los detalles de los productos
    this.products.forEach(product => product.showDetails = false);
  }
}
  // Verificar si product.imageUrls es un array
  isImageArray(product: any): boolean {
    return Array.isArray(product.imageUrls);
  }
 
  // Función para manejar el error de carga de imágenes
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/descarga.jpg'; // Ruta de la imagen predeterminada
    target.classList.remove('normal-image'); // Quita la clase normal
    target.classList.add('error-image'); // Agrega la clase de error
  }

  //metodo para validar que el producto tenga al menos una imagen, y devuelva la primera imagen
  preprocessProducts() {
    this.products.forEach(product => {
      // Aseguramos que imageUrls siempre sea un array
      if (!Array.isArray(product.imageUrls)) {
        // Si no es un array, lo convertimos en un array con una sola URL
        product.imageUrls = [product.imageUrls];
      }
    });
  }
  //Metodo para solicitar los valores del proveedor
  loadProviders(): void {
    this.apiService.getProveedores().subscribe(
      (data) => {
        this.providers = data.map((prove: any) => ({
          value: prove.cCvePrv,
          label: prove.cNomPrv,
        }));
      },
      (error) => {
        console.error('Error al cargar los proveedores:', error);
      }
    );
  }

  //Metodo para solicitar los valores de las lineas
  loadLines(): void {
    this.apiService.getLineas().subscribe(
      (data) => {
        this.lines = data.map((line: any) => ({
          value: line.nCveLin,  // Aquí usas el código numérico
          label: line.cDesLin,  // Y aquí el nombre de la línea
        }));
      },
      (error) => {
        console.error('Error al cargar las líneas:', error);
      }
    );
  }
  //Metodo para pintar los productos con el filtro de lineas aplicado
  onLineFilterChange() {
    this.page = 1;  // Resetear la página cuando cambia el filtro
    this.calculateTotalPages(); // Recalcular las páginas después de aplicar el filtro
  }
  //metodo para cargar las medidas
  loadUnits(): void {
    this.apiService.getMedidas().subscribe(
      (data) => {
        this.units = data.map((unit: any) => ({
          value: unit.nCveUM,
          label: unit.cDesUM,
        }));
      },
      (error) => {
        console.error('Error al cargar las medidas:', error);
      }
    );
  }
  
  //Metodo para para pintar los productos con el filtro de unidades aplicado
  onUnitsFilterChange() {
    this.page = 1;  // Resetear la página cuando cambia el filtro
    this.calculateTotalPages(); // Recalcular las páginas después de aplicar el filtro
  }

  //metodo apra mostrar las seccion 
  showSection(section: string) {
    this.activeSection = section; // Cambia la sección activa
  }

  //Metodo para restablecer la vista
  resetView() {
    this.activeSection = ''; 
  }

  //Metodo para filtrar los productos y recalcula el paginado
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

  //Metodo para el filtrado por categorias en todos los productos
  filteredProducts() {
    // Filtra los productos según el texto de búsqueda, la línea seleccionada y el estado
    const filtered = this.products.filter((product) => {
      const matchesText =
        this.filterText ?
          (product.cCodPrd.toLowerCase().includes(this.filterText.toLowerCase()) ||
            product.cDesPrd.toLowerCase().includes(this.filterText.toLowerCase()))
          : true;

      const matchesLine = this.selectedLine ? product.nLinPrd === this.selectedLine : true;
      const matchesUnits = this.selectedUnits ? product.nUniPrd === this.selectedUnits : true;
      const matchesStatus = this.selectedStatus !== null ? (this.selectedStatus ? product.nEdoPrd === 1 : product.nEdoPrd === 0)
        : true;
      const matchesInventory =
        this.selectedInventory !== null
          ? this.selectedInventory
            ? product.nInvAPrd > 0
            : product.nInvAPrd === 0
          : true;

      return matchesText && matchesLine && matchesStatus && matchesUnits && matchesInventory;
    });

    // Si no hay productos, reseteamos la paginación y mostramos el mensaje
    if (filtered.length === 0) {
      this.page = 1;
      this.totalPages = 0;
      return [];
    }

    // Paginación: aseguramos que la página esté dentro del rango
    const startIndex = (this.page - 1) * this.itemsPerPage;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage); // Actualiza el total de páginas
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  //Lista de metodos para el filtrado correspondiente de cada filtro de "categorias"
  onStatusFilterChange() {
    this.page = 1;
    this.calculateTotalPages();
  }

  onFilterChange() {
    this.page = 1;
    this.calculateTotalPages(); // Recalcula el total de páginas según el nuevo filtro
  }
  onInventoryFilterChange() {
    this.page = 1;
    this.calculateTotalPages(); // Recalcula el total de páginas según el nuevo filtro
  }

  //Metodo para calcular las paginas en el paginado
  calculateTotalPages() {
    const filtered = this.filterText
      ? this.products.filter((product) =>
        product.cCodPrd.toLowerCase().includes(this.filterText.toLowerCase()) ||
        product.cDesPrd.toLowerCase().includes(this.filterText.toLowerCase())
      )
      : this.products;

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
  }

  //Metodo para cambiar de pagina en el paginado
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.calculateTotalPages(); // Recalcula el total de páginas
    }
  }

  //Metodo de paginacion en todos los productos
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

  //Metodo para el formulario 
  toggleForm(): void {
    this.showForm = !this.showForm; // Alterna la visibilidad del formulario
    this.editingProduct = null; // Resetea el producto en edición
    this.productForm.reset(); // Limpia el formulario

    if (!this.showForm) {
      // Si el formulario se cierra, habilita todos los campos
      for (let control in this.productForm.controls) {
        this.productForm.controls[control].enable();  // Habilita todos los controles
      }
    }
  }
//Metodo para mostrar los detalles del producto y tambien para cerrarlos
  toggleProductDetails(product: any, event: MouseEvent) {
    // Evitar que el clic en la fila del producto cierre el detalle
    event.stopPropagation();
  
    // Cerrar los detalles de todos los productos
    this.products.forEach(p => {
      if (p !== product) {
        p.showDetails = false;
      }
    });
  
    // Alterna la visibilidad solo del producto seleccionado
    product.showDetails = !product.showDetails;
  }
  


  //Metodo para hacer el submit 
  onSubmit() {
    if (this.productForm.valid) {
      const product = this.productForm.value;
      if (this.editingProduct) {
        this.updateProduct(product);
      } else {
        this.createNewProduct(product);
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: `Por favor, completa todos los campos obligatorios antes de enviar.`,
      });
    }
  }

  //Metodo para la creacion de un nuevo producto , realiza la insercion en la base de datos
  createNewProduct(product: any) {
    this.apiService.createProduct(product).subscribe(
      () => {
        Swal.fire({
          icon: 'success',
          title: `Producto Creado`,
        });
        this.fetchProducts();
        this.resetForm();
        this.enableAllFormFields();
      },
      (error) => {
        console.error('Error al crear el producto:', error);
        Swal.fire({
          icon: 'warning',
          title: `Codigo de producto dublicado , intente con otro diferente por favor :D!`,
        });
      }
    );
  }

  //Metodo para actualizar un producto y mandar la peticion put al api
  updateProduct(product: any) {
    // Habilitar todos los campos del formulario antes de enviarlos
    this.enableAllFormFields();

    // Obtener los datos del formulario
    const productData = this.productForm.value;

    this.apiService.updateProduct(productData).subscribe(
      () => {
        Swal.fire({
          icon: 'success',
          title: `Producto Actualizado`,
        });
        this.fetchProducts();
        this.resetForm();
        this.enableAllFormFields(); // Resetear el formulario después de la actualización
      },
      (error) => {
        console.error('Error al actualizar el producto:', error);
        alert('Hubo un problema al actualizar el producto.');
      }
    );
  }

  //Metodo para habilitar la edicion de los campos especificos del formulario
  enableAllFormFields() {
    for (let control in this.productForm.controls) {
      this.productForm.controls[control].enable();  // Habilitar todos los controles
    }
  }

  //Reinicia el formulario para poder seguir registrado productos
  resetForm() {
    this.productForm.reset();
    this.editingProduct = null;
    this.showProductForm = false;
    // Habilita todos los campos del formulario cuando se cierra el formulario
    this.enableAllFormFields();

    // Vuelve a deshabilitar los campos no editables
    this.setFormFieldsEditable();
  }

  //Metodo para eliminar un producto
  deleteProduct(cCodPrd: string) {
    const product = this.products.find((p) => p.cCodPrd === cCodPrd);
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.deleteProduct(cCodPrd).subscribe(() => {
          Swal.fire({
            icon: 'warning',
            title: ` ${product?.cDesPrd || 'desconocido'} Eliminado`,
          });
          this.fetchProducts();
        });
      }
    });
  }

//Metodo para habilitar las celdas del formulario  
  setFormFieldsEditable() {
    // Deshabilita todos los campos por defecto
    for (let control in this.productForm.controls) {
      this.productForm.controls[control].disable();
    }

    // Solo habilita los campos que están en la lista editableFields
    this.editableFields.forEach(field => {
      if (this.productForm.controls[field]) {
        this.productForm.controls[field].enable();
      }
    });
  }

  //Metodo para editar un producto y mostrar el formulario
  editProduct(product: any) {
    this.editingProduct = product;
    // Asegúrate de que las fechas estén en el formato 'YYYY-MM-DD'
    const transformedProduct = {
      ...product,
      dAltPrd: product.dAltPrd ? new Date(product.dAltPrd).toISOString().split('T')[0] : null,
      dUltPrd: product.dUltPrd ? new Date(product.dUltPrd).toISOString().split('T')[0] : null,
    };

    this.productForm.patchValue(transformedProduct);
    // Habilita solo los campos editables
    this.setFormFieldsEditable();
    this.showForm = true;
  }

  //Metodo para cerrar la sesion activa
  logout() {
    this.authService.logout();
    // Redirige al login después de hacer logout
    window.location.href = '/login';  // O usa this.router.navigate(['/login']) si tienes Router
  }

  //Metodo para abrir el modal de vales
  openValesModal(product: any): void {
    // Extrae solo el cCodPrd (el identificador único)
    const productId = product.cCodPrd;
    const desproduct = product.cDesPrd;
    console.log('productId recibido en openValesModal:', productId);

    if (!productId) {
      console.error('El productId no es válido:', productId);
      return;  // Si productId no es válido, no abrir el modal
    }

    const dialogRef = this.dialog.open(ValesModalComponent, {
      width: '1600px',
      data: { productId: productId, desproduct: desproduct },  // Solo pasamos el productId y la descripcion
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal fue cerrado');
    });
  }

  //Metodo para abrir el modal de kardex
  openModalKardex(product: any): void {
    // Extrae solo el cCodPrd (el identificador único)
    const productId = product.cCodPrd;
    const desproduct = product.cDesPrd;
    console.log('productId recibido en openModalKardex:', productId);

    if (!productId) {
      console.error('El productId no es válido:', productId);
      return;  // Si productId no es válido, no abrir el modal
    }

    const dialogRef = this.dialog.open(KardexModalComponent, {
      width: '1600px',
      data: { productId: productId, desproduct: desproduct },  // Solo pasamos el productId y la descripcion
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal fue cerrado');
    });
  }

  //Metodo para abrir el modal de compras
  openModalCompras(product: any): void {
    // Extrae solo el cCodPrd (el identificador único)
    const productId = product.cCodPrd;
    const desproduct = product.cDesPrd;
    console.log('productId recibido en openModalCompras:', productId);

    if (!productId) {
      console.error('El productId no es válido:', productId);
      return;  // Si productId no es válido, no abrir el modal
    }

    const dialogRef = this.dialog.open(ComprasModalComponent, {
      width: '1600px',
      data: { productId: productId, desproduct: desproduct },  // Solo pasamos el productId y la descripcion
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal fue cerrado');
    });
  }
   //Metodo para habilitar el producto con una ventana de confirmacion
   habilitarProducto(cCodPrd: string): void {
    const product = this.products.find((p) => p.cCodPrd === cCodPrd);
// Verifica si el producto tiene inventario
//if (product && product.nInvAPrd <= 0) {
  //Swal.fire({
   // icon: 'error',
   // title: 'No se puede habilitar',
   // text: `El producto "${product.cDesPrd}" no puede ser habilitado porque no cuenta con existencias.`,
  //});
 // return;
//}
    // Abre el diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Habilitación',
        message: `¿Estás seguro de que deseas Habilitar el producto "${product?.cDesPrd || 'desconocido'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.habilitarProducto(cCodPrd).subscribe(
          () => {
            if (product) {
              product.nEdoPrd = true;
              Swal.fire({
                icon: 'success',
                title: ` ${product.cDesPrd || 'desconocido'} Habilitado`,
              });
              this.fetchProducts();
            }
          },
          (error) => console.error('Error al habilitar el producto:', error)
        );
      }
    });
  }

  //Metodo para deshabilitar el producto con una ventana de confirmacion
  deshabilitarProducto(cCodPrd: string): void {
    const product = this.products.find((p) => p.cCodPrd === cCodPrd);
 // Verifica si el producto tiene inventario
 if (product && product.nInvAPrd > 0) {
  Swal.fire({
    icon: 'error',
    title: 'No se puede deshabilitar',
    text: `El producto "${product.cDesPrd}" no puede ser deshabilitado porque tiene existencias.`,
  });
  return;
}
    // Abre el diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Deshabilitación',
        message: `¿Estás seguro de que deseas deshabilitar el producto "${product?.cDesPrd || 'desconocido'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.deshabilitarProducto(cCodPrd).subscribe(
          () => {
            if (product) {
              product.nEdoPrd = false;
              Swal.fire({
                icon: 'warning',
                title: ` ${product.cDesPrd || 'desconocido'} Deshabilitado`,
              });
              this.fetchProducts();
            }
          },
          (error) => console.error('Error al deshabilitar el producto:', error)
        );
      }
    });
  }


  //Metodo para obtener el nombre de la linea dependiendo del numero de la linea
  getLineas(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'ELECTRICO';
      case 2:
        return 'SUSPENCION';
      case 3:
        return 'MOTOR';
      case 4:
        return 'DIRECCION';
      case 5:
        return 'PINTURA';
      case 6:
        return 'CLIMA';
      case 7:
        return 'CRISTALES';
      case 8:
        return 'ANGULOS';
      case 9:
        return 'LLANTAS';
      case 10:
        return 'TORNO';
      case 11:
        return 'HULES';
      case 12:
        return 'HERRAMIENTA';
      case 13:
        return 'TRANSMISIONES';
      case 14:
        return 'DIFERENCIAL';
      case 15:
        return 'CLUTCH';
      case 16:
        return 'FLECHAS CARDAN';
      case 17:
        return 'EJE DELANTERO';
      case 18:
        return 'RUEDA DELANTERA';
      case 19:
        return 'RUEDA TRASERA';
      case 20:
        return 'SISTEMA DE FRENOS';
      case 21:
        return 'TORNILLERIA';
      case 22:
        return 'SEGURIDAD INDUSTRIAL';
      case 23:
        return 'RADIADOR';
      case 24:
        return 'RADIADORES';
      case 25:
        return 'LLANTAS ALIN. Y BALANCEO';
      case 26:
        return 'VIDEO Y ELECTRONICA';
      case 28:
        return 'GRASAS Y LUBRICANTES';
      case 29:
        return 'MUELLES';
      case 30:
        return 'TAPICERIA';
      case 31:
        return 'FIBRAS Y RESINAS';
      case 32:
        return 'RODAMIENTOS';
      case 33:
        return 'LIQUIDO P/FRENOS EXTRA PESADO 350ML';
      case 34:
        return 'CILINDRO ESCLAVO DE CLUTCH M.B.';
      case 35:
        return 'YUGO SOLD. TUB. 4" (279)';
      case 36:
        return 'BAÑOS';
      case 37:
        return 'SISTEMA DE ESCAPE';
      case 38:
        return 'SISTEMA DE ENFRIAMIENTO';
      case 39:
        return 'SISTEMA DE COMBUSTIBLE';
      case 40:
        return 'SISTEMA DE ADMISION';
      case 41:
        return 'CARROCERIA';
      case 42:
        return 'SISTEMA DE SUSPENSION';
      case 43:
        return 'SISTEMA EJE DELANTERO';
      case 44:
        return 'SISTEMA EJE TRASERO';
      case 45:
        return 'SISTEMA DE COMBUSTIBLE';
      case 46:
        return 'SISTEMA DE LUBRICACION';
      case 47:
        return 'SISTEMA DE LUCES';
      case 48:
        return 'SISTEMA AIRE ACONDICIONADO';
      case 49:
        return 'QUIMICOS';
      case 50:
        return 'SISTEMA ENFRIAMIENTO';
      default:
        return 'Desconocido';
    }
  }

 

//Metoodo para convertir a string los nombres de los proveedores dependiendo su valor numerico
  getProveedor(proveedorID: string): string {
    switch (proveedorID) {
      case '2102191000':
        return 'GOMEZ HERNANDEZ SALUSTIA TERESA';
      case '2102110000':
        return 'GRUPO DECME,S.A DE C.V';
      case '2102111000':
        return 'IBAÑEZ VALDES JUAN JESUS ISAIAS';
      case '2102112000':
        return 'IDIR COMERCIAL, S.A. DE C.V.';
      case '2102113000':
        return 'IMPULSA COMERCIALIZADORA, S.A. DE C.V.';
      case '2102114000':
        return 'INDUSTRIA DE MAQUINADOS EN GENERAL, S.A. DE C.V.';
      case '2102115000':
        return 'INDUSTRIAL VACHOSA ZUMPANGO, S.A. DE C.V.';
      case '2102116000':
        return 'INDUSTRIAS MICHELIN, S.A. DE C.V.';
      case '2102117000':
        return 'INDUSTRIAS OCABA, S.A. DE C.V.';
      case '2102118000':
        return 'INFRA, S.A. DE C.V.';
      case '2102119000':
        return 'INYECCION DIESEL METROPOLITANA, S.A. DE C.V.';
      case '2102177000':
        return 'TURBO INYECCION DE PUEBLA S. DE R.L DE C.V';
      case '2102255000':
        return 'TREJO FLORES ZACARIAS';
      case '2102250000':
        return 'TELLEZ SALOMON NUBIA ANGELICA';
      case '2102257000':
        return 'CARRERA RAMIREZ ERNESTO';
      case '2102258000':
        return 'MERCADO PERALTA KARINA';
      case '2102298000':
        return 'ROSEROS VELAZQUEZ ALICIA';
      case '2102287000':
        return 'VELAZQUEZ MARTINEZ MARIA';
      case '2102259000':
        return 'ROSAS HERNANDEZ SANTIAGO';
      case '2102260000':
        return 'LA PALOMA COMPAÑIA DE METALES, S.A DE C.V';
      case '2102288000':
        return 'JAIFER, S.A. DE C.V.';
      case '2102056000':
        return 'SOCIEDAD EDITORA ARRONIZ, S.A.';
      case '2102174000':
        return 'SOMER, S.A. DE C.V.';
      case '2102206000':
        return 'SORIANO PAVON REYNA';
      case '2102195000':
        return 'SUAREZ FERNANDEZ LILIANA GUADALUPE';
      case '2102175000':
        return 'SUMINISTROS MEDORIO, S.A. DE C.V.';
      case '2102245000':
        return 'LOPEZ ROSAS JOSE RICARDO';
      case '2102057000':
        return 'SURT. AUTOMOTRIZ VERACRUZANA, S.A. DE C.V.';
      case '2102211000':
        return 'TAM PAEZ LILIA';
      case '2102155000':
        return 'PRAXAIR MEXICO, S. DE R.L. DE C.V.';
      case '2102290000':
        return 'ACOSTA GONZALEZ SANDRA GUADALUPE';
      case '2102249000':
        return 'SANTIAGO VELAZQUEZ RICARDO';
      case '2102251000':
        return 'TECNOLOGIA EN MAQUINAS Y BORDADORAS S.A DE C.V';
      case '2102252000':
        return 'VELA SANCHEZ SANTIAGO';
      case '2102253000':
        return 'COZAR RAYGOZA GRACIELA GABRIELA';
      case '2102046000':
        return 'RODRIGUEZ Y RODRIGUEZ, S.A. DE C.V.';
      case '2102047000':
        return 'ROJAS SALAZAR SANDRA';
      case '2102048000':
        return 'ROMANO DISTRIBUIDORA DE ARTICULOS, S.A. DE C.V.';
      case '2102134000':
        return 'MARTINEZ ROJAS JUAN CARLOS';
      case '2102210000':
        return 'RAFAEL TRUJILLO FERNANDEZ';
      case '2102028000':
        return 'RAHME REPRESENTACIONES, S.A. DE C.V.';
      case '2102029000':
        return 'RAICO -JORGE SANCHEZ JACOME-';
      case '2102204000':
        return 'RAMIREZ MULATO EUSTOLIA';
      case '2102221000':
        return 'MA. LORENA TRUJILLO MOYADO';
      case '2102222000':
        return 'MARTHA AMPARO TRUJEQUE MANZANO';
      case '2102223000':
        return 'PLACAS LAMINAS Y PERFILES DE VERACRUZ, S.A DE C.V';
      case '2102224000':
        return 'CORTES SALAZAR SAUL';
      case '2102225000':
        return 'GASPERIN GARCIA SEVERO';
      case '2102226000':
        return 'ACEROS Y TALLERES FRANCO, S.A DE C.V';
      case '2102044000':
        return 'RODAMIENTOS Y RETENES DE CORDOBA, S.A DE C.V';
      case '2102065000':
        return 'WURTH MEXICO, S.A. DE C.V.';
      case '2102180000':
        return 'ZUCCOLOTTO VAZQUEZ VERONICA ALICIA';
      case '2102066000':
        return 'XOLUX COMPUTADORAS, S.A. DE C.V.';
      case '2102218000':
        return 'CHAVEZ GARCIA PORFIRIO JAIME';
      case '2102219000':
        return 'CORONA VAZQUEZ CLAUDIA';
      case '2102001000':
        return 'ABASTECEDORA DE COMBUSTIBLE COSOLAPA';
      case '2102004000':
        return 'ACCESORIOS Y PARTES DEL PUERTO, S.A. DE C.V.';
      case '2102099000':
        return 'GASOLINERIA COSCOMATEPEC, S.A. DE C.V.';
      case '2102269000':
        return 'BRINGAS MURRIETA ARMANDO';
      case '2102156000':
        return 'PRINTER, S.A. DE C.V.';
      case '2102157000':
        return 'PRODUCTOS AHULADOS INDUSTRIALES, S.A. DE C.V.';
      case '2102158000':
        return 'PROLIQUIN ASESORES, S.A. DE C.V.';
      case '2102216000':
        return 'PROVEEDOR MAYORISTA AL REFACCIONARIO, S.A. DE C.V.';
      case '2102159000':
        return 'PTC ABASTECEDORA INDUSTRIAL, S.A. DE C.V.';
      case '2102128000':
        return 'LUBRICANTES ESPECIALIZADOS DE VERACRUZ, S.A. DE C.V.';
      case '2102131000':
        return 'MACIEL MACIEL ABEL SALVADOR';
      case '2102194000':
        return 'MACRO FRENOS Y CLUTCH, S.A DE C.V.';
      case '2102202000':
        return 'MADERAS DELTER, S.A DE C.V.';
      case '2102149000':
        return 'OSORIO BAEZ RAUL';
      case '2102150000':
        return 'OSORIO CHAMA LIDIA';
      case '2102151000':
        return 'PELAEZ DIORD ANA LUISA';
      case '2102152000':
        return 'PEÑA PERRONI ANTONIO';
      case '2102153000':
        return 'PLASTICOS REFORZADOS Y COMPONENTES METALICOS, S.A. DE C.V.';
      case '2102135000':
        return 'MATERIALES Y ACEROS TUCAN, S.A. DE C.V.';
      case '2102136000':
        return 'MENDOZA SALINAS ARTURO GIL';
      case '2102137000':
        return 'METALURVE, S.A. DE C.V.';
      case '2102138000':
        return 'MOLINA PADUA ALEJANDRO';
      case '2102033000':
        return 'REFACCIONARIA GARDOM, S.A. DE C.V.';
      case '2102187000':
        return 'REFACCIONARIA TRACTO DIESEL DE CORDOBA, S.A. DE C.V.';
      case '2102246000':
        return 'HIDRO GAS DE VERACRUZ, S.A DE C.V';
      case '2102247000':
        return 'PULIDO TORRES ELODIA';
      case '2102295000':
        return 'MACIAS BALDERAS JOSE BERNARDO';
      case '2102296000':
        return 'RODRIGUEZ HERNANDEZ MARCELINO';
      case '2102297000':
        return 'PITOL ZANATTA YOLANDA CONSUELO';
      case '2102034000':
        return 'REFACCIONES Y SERV. BARRANCA SECA, S.A. DE C.V.';
      case '2102291000':
        return 'TAPIA HERNANDEZ ORLANDO';
      case '2102102000':
        return 'GONZALEZ RODRIGUEZ MARIA LUISA';
      case '2102103000':
        return 'GRUPO CORDOBA DE TRANSPORTES, S.A. DE C.V.';
      case '2102104000':
        return 'GRUPO GOMMAR, S.A. DE C.V.';
      case '2102105000':
        return 'GRUPO PUBLICITARIO DEL GOLFO, S.A. DE C.V.';
      case '2102183000':
        return 'GUZMAN CARDENAS LUIS ANTONIO';
      case '2102106000':
        return 'HERNANDEZ ESCORZA DAGOBERTO';
      case '2102107000':
        return 'HERNANDEZ GUTIERREZ MA. DEL CARMEN';
      case '2102108000':
        return 'HERRAMIENTAS GRUPO ORIZABA, S.A. DE C.V.';
      case '2102228000':
        return 'ARREGOITIA DEL ANGEL MARIA DEL CARMEN';
      case '2102229000':
        return 'CARRERA GAMBOA ERNESTO';
      case '2102230000':
        return 'GARCIA BARRUETA MARIA ESTELA';
      case '2102090000':
        return 'DOMINGUEZ CORTEZ VIRGINIA';
      case '2102208000':
        return 'ESTUFAS Y GAS DE CORDOBA,S.A';
      case '2102091000':
        return 'FERRETERA EL CLAVO CORDOBES, S.A. DE C.V.';
      case '2102262000':
        return 'HERNANDEZ ALVARADO CARMEN AIDE';
      case '2102092000':
        return 'FESTOTAL, S.A. DE C.V.';
      case '2102093000':
        return 'FLORES LOPEZ GABRIELA';
      case '2102094000':
        return 'FLORES SUAREZ JESUS';
      case '2102095000':
        return 'FRIGOLET CARDOSO JAIME';
      case '2102096000':
        return 'GAFF INTERNACIONAL, S.A. DE C.V.';
      case '2102154000':
        return 'PORRES HERNANDEZ ALEJANDRA';
      case '2102035000':
        return 'RENOVADORA GUZMAN DE CORDOBA, S. DE R.L. DE C.V.';
      case '2102036000':
        return 'RENOVADORA ZUCA DEL SURESTE, S.A. DE C.V.';
      case '2102037000':
        return 'REPRES. SELECTAS DEL SURESTE, S.A. DE C.V.';
      case '2102038000':
        return 'REYNALDO HDEZ MOSENCAHUA -FUERZA DIESEL-';
      case '2102041000':
        return 'RHINES MARTINEZ, S.A. DE C.V.';
      case '2102162000':
        return 'RHINES Y RODAMIENTOS FILUZ, S.A. DE C.V.';
      case '2102039000':
        return 'RICARDA FRANCISCO REMIGIO';
      case '2102129000':
        return 'LLANTAS DEL TROPICO, S.A. DE C.V.';
      case '2102130000':
        return 'LLANTERA GARROM, S.A. DE C.V.';
      case '2102172000':
        return 'SERVICIO AVENIDA, S.A. DE C.V.';
      case '2102173000':
        return 'SERVICIO SAMPIERI, S.A. DE C.V.';
      case '2102053000':
        return 'SERVICIOS CENTENO, S.A. DE C.V.';
      case '2102054000':
        return 'SERVICIOS UNIDOS FORTIN, S.A.';
      case '2102207000':
        return 'SHESEÑA SORIANO JAIME FRANCISCO';
      case '2102055000':
        return 'SISTEMAS CONTINO, S.A. DE C.V.';
      case '2102071000':
        return 'CALVARIO NOLASCO OFELIA';
      case '2102011000':
        return 'MORENO DIESEL, S. A. DE C. V.';
      case '2102072000':
        return 'CANTON MATA LIBRADA';
      case '2102012000':
        return 'CARLIN SOSA VICTORIA';
      case '2102073000':
        return 'CARROCERIAS Y DISEÑOS PROYECCION 2000, S.A. DE C.V.';
      case '2102013000':
        return 'CASA SOMMER, S.A. DE C.V.';
      case '2102231000':
        return 'CARRERA RODRIGUEZ REYNA';
      case '2102232000':
        return 'JACOME GARCIA FRANCISCA';
      case '2102282000':
        return 'ROMERO OLVERA LUIS';
      case '2102233000':
        return 'FLORES FLORES SERGIO MARGARITO';
      case '2102018000':
        return 'CONEXIONES Y MANGUERAS DE CBA, S.A. DE C.V.';
      case '2102019000':
        return 'CORDOBA AUTOMOTRIZ, S.A. DE C.V.';
      case '2102083000':
        return 'CORONA GONZALEZ OSCAR';
      case '2102236000':
        return 'FLORES RIVERA ILEANA CONCEPCION';
      case '2102237000':
        return 'KENWORTH DEL ESTE S.A DE C.V';
      case '2102238000':
        return 'DOMINGUEZ PALACIOS LUIS JAVIER';
      case '2102084000':
        return 'CORPORATIVO REPSA, S.A. DE C.V.';
      case '2102020000':
        return 'CRISTAL INASTILLABLE O TEMPLADO, S.A. DE C.V.';
      case '2102085000':
        return 'CRUZ RAMIREZ MIGUEL ANGEL';
      case '2102201000':
        return 'CUMMINS DE ORIENTE, S.A. DE C.V.';
      case '2102021000':
        return 'CYMECO ELECTROILUMINACION';
      case '2102197000':
        return 'DELGADO GUTIERREZ DE VELAZCO AUGUSTA VICTORIA';
      case '2102298000':
        return 'PARDO SANCHEZ MARIA CRISTINA';
      case '2102287000':
        return 'JORGE ALBERTO GONZALEZ RAMIREZ';
      case '2102288000':
        return 'GRUPO REFACCIONARIO BALDERAS, S.A DE C.V';
      case '2102301000':
        return 'INDUSTRIAS PELVER, S.A DE C.V';
      case '2102023000':
        return 'DELGADO RUIZ DALIA LUZ';
      case '2102086000':
        return 'DEMUNER FLORES DORA PAULA';
      case '2102024000':
        return 'DIEX REFRIMOTORES Y VENTILACION, S.A. DE C.V.';
      case '2102009000':
        return 'BROCAS, ABRASIVOS Y REPRES., S.A. DE C.V.';
      case '2102070000':
        return 'CALDERON TEJEDA ERNESTO';
      case '2102010000':
        return 'CALNELLI DE VERACRUZ, S.A. DE C.V.';
      case '2102089000':
        return 'DISTRIBUIDORA METROPOLITANA DE PARTES DIESEL, S.A. DE C.V.';
      case '2102242000':
        return 'NAVA NARANJOS MIGUEL';
      case '2102243000':
        return 'RENO REFACCIONES S.A DE C.V';
      case '2102244000':
        return 'SERRANO GUTIERREZ MARIA MARGARITA';
      case '2102074000':
        return 'CASTRO JACOME NATALIA';
      case '2102075000':
        return 'CENTENO GIL ROBERTO';
      case '2102076000':
        return 'CENTRO DE LLANTAS DIEZ, S.A. DE C.V.';
      case '2102014000':
        return 'CERMA AUTOMOTRIZ, S.A. DE C.V.';
      case '2102022000':
        return 'CHAVEZ GONZALEZ FERNANDO';
      case '2102015000':
        return 'CIA. MEX. DE TRASLADO DE VALORES';
      case '2102077000':
        return 'COMBUSTIBLE DE TEZONAPA, S.A. DE C.V.';
      case '2102078000':
        return 'COMERCIAL ORO DE CORDOBA, S.A. DE C.V.';
      case '2102016000':
        return 'COMERCIALIZACION Y SERV.  AUTOINDUSTRIALES, S.A. DE C.V.';
      case '2102079000':
        return 'COMERCIALIZADORA OGAZON, S.A. DE C.V.';
      case '2102017000':
        return 'COMERCIALIZADORA POLOS DE CORDOBA, S.A. DE C.V.';
      case '2102080000':
        return 'COMETRA SERVICIOS INTEGRALES';
      case '2102005000':
        return 'ACEROS Y METALES DE CORDOBA, S.A. DE C.V.';
      case '2102067000':
        return 'ACTIA DE MEXICO, S.A. DE C.V.';
      case '2102040000':
        return 'RICARDO LOPEZ PLATAS -TAMBORES Y BALATAS DEL CENTRO-';
      case '2102163000':
        return 'RIVERA CRUZ PEDRO';
      case '2102042000':
        return 'RIVERA DORANTES RICARDO';
      case '2102164000':
        return 'RODAMIENTOS DE ALTO RENDIMIENTO, S.A. DE C.V.';
      case '2102043000':
        return 'RODAMIENTOS INDUSTRIALES DE CORDOBA, S.A. DE C.V.';
      case '2102165000':
        return 'RODRIGUEZ BALBUENA SAMUEL';
      case '2102045000':
        return 'RODRIGUEZ CARMONA ALICIA';
      case '2102120000':
        return 'IRIZAR MEXICO, S.A. DE C.V.';
      case '2102121000':
        return 'JBF, S.A. DE C.V.';
      case '2102184000':
        return 'LOBATO XACA MANUEL';
      case '2102124000':
        return 'LOPEZ GARCES GABRIEL';
      case '2102125000':
        return 'LOPEZ PLATAS RICARDO AGUSTIN';
      case '2102126000':
        return 'LOPEZ RAMIREZ JORGE';
      case '2102127000':
        return 'LOPEZ SOLANO JOSE';
      case '2102283000':
        return 'HERNANDEZ SANCHEZ GERARDO ADALBERTO';
      case '2102272000':
        return 'VOLVO DE MEXICO, S.A. DE C.V.';
      case '2102241000':
        return 'RODRIGUEZ LAZO JOSE RAFAEL';
      case '2102139000':
        return 'MONTIEL VAZQUEZ JOAQUIN';
      case '2102140000':
        return 'MORALES CASTRO LAZARO';
      case '2102141000':
        return 'MORALES HERNANDEZ MIGUEL ANGEL';
      case '2102196000':
        return 'MORALES SANCHEZ DELFINO';
      case '2102142000':
        return 'MUELLES SUAREZ, S.A. DE C.V.';
      case '2102217000':
        return 'MURILLO VEGA RICARDO GERARDO';
      case '2102185000':
        return 'NAVARRETE SALAZAR MARIA ISABEL ARACELI';
      case '2102143000':
        return 'NEPANUCENO ROSAS JUAN';
      case '2102144000':
        return 'NIETO VELAZQUEZ MANUEL';
      case '2102003000':
        return 'ACCESORIOS DE CALIDAD INTERNACIONAL, S.A. DE C.V.';
      case '2102263000':
        return 'ROJAS TRUJILLO MAURO';
      case '2102264000':
        return 'RODRIGUEZ FERNANDEZ IVONNE';
      case '2102270000':
        return 'ZENTELLA DE SANTIAGO ANA DE LOURDES';
      case '2102203000':
        return 'VALDES LAZO ATENOGENES';
      case '2102063000':
        return 'VELAZQUEZ GOMEZ JAIME';
      case '2102190000':
        return 'AMIEVA PEREZ, S. DE R.L. Y C.V.';
      case '2102239000':
        return 'REFRIGERACION Y AIRE ACONDICIONADO DE CORDOBA, S.A DE C.V';
      case '2102007000':
        return 'AUTOMOVILES Y CAMIONES RIVERA, S.A. DE C.V.';
      case '2102008000':
        return 'AUTO-TODO MEXICANA, S.A. DE C.V.';
      case '2102132000':
        return 'MANGUERAS Y BANDAS DEL SURESTE, S.A. DE C.V.';
      case '2102192000':
        return 'BARRANCO ARREDONDO ADOLFO';
      case '2102069000':
        return 'BARRANCO BARBOSA RODOLFO';
      case '2102166000':
        return 'ROSAS PEREZ ALBERTO';
      case '2102240000':
        return 'MIÑON GONZALEZ ROSA';
      case '2102049000':
        return 'SANCHEZ APARICIO ENRIQUE';
      case '2102167000':
        return 'SANCHEZ SUAREZ ARMANDO';
      case '2102168000':
        return 'SANTIAGO CRUZ MAGDALENA';
      case '2102169000':
        return 'SANTOS Y VIDAL GRACIELA';
      case '2102301000':
        return 'GONZALEZ MORALES JOSE OMAR';
      case '2102261000':
        return 'DOMINGUEZ HERNANDEZ HECTOR DAVID';
      case '2102215000':
        return 'MARTINEZ LANDERO ALFONSO';
      case '2102265000':
        return 'MENDOZA VALENCIA ALEJANDRA';
      case '2102266000':
        return 'GALVEZ GRAGEDA MIGUEL AGUSTIN';
      case '2102279000':
        return 'DISTRIBUIDORA Y PRODUCTORA BLANCO, S.A DE C.V';
      case '2102198000':
        return 'GALARZA TORRES JUAN JOSE';
      case '2102097000':
        return 'GARCIA GARCIA JUAN LUIS';
      case '2102098000':
        return 'GARZON LOPEZ JOSE ANTONIO';
      case '2102081000':
        return 'COMSA SEGURIDAD INTEGRAL, S.A. DE C.V.';
      case '2102082000':
        return 'CONCHA ELIZARRARAZ MARIA DE LOURDES';
      case '2102268000':
        return 'MARTINEZ YAÑEZ JOSE ALFREDO';
      case '2102100000':
        return 'GOMSA AUTOMOTRIZ, S.A. DE C.V.';
      case '2102101000':
        return 'GOMSA CAMIONES, S.A. DE C.V.';
      case '2102200000':
        return 'GONZALEZ GONZALEZ DOLORES GEORGINA';
      case '2102160000':
        return 'QUINTERO SORCIA JESUS';
      case '2102027000':
        return 'RADIOMOVIL DIPSA, S.A. DE C.V.';
      case '2102161000':
        return 'RAMIREZ VAZQUEZ LUZ ALBA';
      case '2102234000':
        return 'RUIZ CARBAJAL CATALINA GELYSSLY';
      case '2102235000':
        return 'MAFFUZ PEÑA WADED';
      case '2102030000':
        return 'RAMOS TELLO PEDRO';
      case '2102031000':
        return 'RECTIFICACION DE MOTORES DE CBA, S.A. DE C.V.';
      case '2102032000':
        return 'RECTIFICACIONES NODO, S.A. DE C.V.';
      case '2102273000':
        return 'JIMENEZ CALVARIO CATALINA';
      case '2102274000':
        return 'DISA DE PUEBLA S.A DE C.V';
      case '2102275000':
        return 'HERNANDEZ MOZENCAHUA ERASMO';
      case '2102276000':
        return 'LOPEZ NAVA IRVING';
      case '2102278000':
        return 'JOSE ANTONIO MANSUR DEMENEGHI';
      case '2102279000':
        return 'ROJAS LIMON FELIPE';
      case '2102280000':
        return 'ROSA MARIA MARTINEZ OLMOS';
      case '2102281000':
        return 'AGRICOLA ANTARIX, S. DE R.L DE C.V';
      case '2102282000':
        return 'RODRIGO TRUJILLO FLORES';
      case '2102295000':
        return 'PAEZ LUCIANO';
      case '2102296000':
        return 'JIMENEZ HERNANDEZ JORGE';
      case '2102297000':
        return 'RIAÑO OLIVARES JUAN';
      case '2102002000':
        return 'ADMINISTRACION DE FLOTAS, S.A. DE C.V.';
      case '2102068000':
        return 'AERA DIESEL, S.A. DE C.V.';
      case '2102212000':
        return 'ALEACIONES, SOLDADURAS Y EQUIPOS DE MEXICO, S.A. DE C.V.';
      case '2102199000':
        return 'ALMEIDA OLIVA PATRICIA YAZMIN';
      case '2102006000':
        return 'ALTAMIRANO FLORES JUAN LUIS';
      case '2102170000':
        return 'SCANIA COMERCIAL, S.A. DE C.V.';
      case '2102051000':
        return 'SCHETTINO JIMENEZ VICTOR ALFONSO';
      case '2102220000':
        return 'PAEZ ILLESCAS RAMIRO';
      case '2102188000':
        return 'SENTIES ALVAREZ SAMUEL';
      case '2102171000':
        return 'SERRANO GARRIDO JOSE LUIS';
      case '2102052000':
        return 'SERV. ESPECIALIZADOS DE GUARDIAS Y ALARMAS';
      case '2102087000':
        return 'DIEZ INTERNACIONAL MOTORES, S.A. DE C.V.';
      case '2102025000':
        return 'DIEZ SANTOS GRACIELA';
      case '2102088000':
        return 'DIEZ SANTOS JUAN CARLOS';
      case '2102026000':
        return 'DIRECCIONES HIDRAULICAS DEL CENTRO';
      case '2102205000':
        return 'DISTRIBUIDORA DE CAMIONES INTERNATIONAL, S. DE R.L. DE C.V.';
      case '2102189000':
        return 'JOSE PENICHET KARINA';
      case '2102209000':
        return 'LAYUN FERNANDEZ GERARDO';
      case '2102122000':
        return 'LEZAMA LEZAMA JORGE';
      case '2102123000':
        return 'LIBREROS TREJO LUIS IGNACIO';
      case '2102214000':
        return 'TAMBORES Y MAZAS CONSULADO, S.A. DE C.V.';
      case '2102181000':
        return 'TEJERO GOMEZ SERGIO ABRAHAM';
      case '2102176000':
        return 'TIENDAS CHEDRAUI, S.A. DE C.V.';
      case '2102058000':
        return 'TORNILLOS DE CORDOBA, S.A. DE C.V.';
      case '2102059000':
        return 'TORRES PEREZ FELIPE FRANCISCO';
      case '2102060000':
        return 'TRACTO REMOLQUES Y REFACCIONES DEL GOLFO';
      case '2102061000':
        return 'TRANSMISIONES VERACRUZANAS, S.A. DE C.V.';
      case '2102177000':
        return 'TURBOINYECCION DIESEL DE PUEBLA, S.A. DE C.V.';
      case '2102062000':
        return 'ULLOA VAZQUEZ GABRIELA';
      case '2102179000':
        return 'UNIGAS DEL PAPALOAPAN, S.A. DE C.V.';
      case '2102109000':
        return 'HERRERA RODRIGUEZ JORGE';
      case '2102145000':
        return 'NOVAL DOMINGUEZ CELSO VICTOR';
      case '2102146000':
        return 'OFICINAS DE CORDOBA, S.A. DE C.V.';
      case '2102147000':
        return 'OFIX, S.A. DE C.V.';
      case '2102148000':
        return 'OMNICARGA, S.,A. DE C.V.';
      case '2102290000':
        return 'AGUILAR ESPINOZA DE LOS M. TAKESHI ARMANDO';
      case '2102292000':
        return 'JOSE RAUL OLIVARES CHABOLLA';
      case '2102291000':
        return 'MARIO PATRICIO GUZMAN CARDENAS';
      case '2102293000':
        return 'SURT. NACIONAL DE RODAMIENTOS, S.A DE C.V';
      case '2102133000':
        return 'MARIA ISABEL JIMENEZ CALVARIO';
      case '2102304000':
        return 'JUAN CARLOS CRUZ VELASCO';
      case '2102305000':
        return 'GUZMAN VELAZQUEZ SELENE CONCEPCION';
      case '2102182000':
        return 'ORTEGA VILLAREAL JOSE';
      case '2102050000':
        return 'SC RODAMIENTOS, S.A. DE C.V.';
      case '2102064000':
        return 'VITANOVA DE CORDOBA, S.A. DE C.V.';
      case '2102213000':
        return 'VITROCAR, S.A. DE C.V.';
      case '2102186000':
        return 'LIDER DE VERACRUZ EN ELECTRONICA, S. DE R.L. DE C.V.';
      default:
        return 'Proveedor no asignado';

    }
  }

  //Metodo para asignarle el nombre a la pieza depende de su numero
  getUnits(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'PIEZA';
      case 2:
        return 'KILO';
      case 3:
        return 'PAQUETE';
      case 4:
        return 'LITRO';
      case 5:
        return 'GALON';
      case 6:
        return 'METRO';
      default:
        return 'Unidad no asignada';
    }
  }


}
