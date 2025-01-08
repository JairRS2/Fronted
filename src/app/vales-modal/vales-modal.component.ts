import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../services/api.service';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-vales-modal',
  templateUrl: './vales-modal.component.html',
  styleUrls: ['./vales-modal.component.css'],
})
export class ValesModalComponent implements OnInit {
  detalles: any[] = [];
  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false); // Indicador de carga
  products: any[] = [];
  productDescription: string = ''; // Variable para almacenar la descripción
  filtervalesxNumber: string = '';
  filterText: string = '';
  filteredData: any[] = []; // Inicialmente vacía
  displayedColumns: string[] = [
    'nnumval',
    'nCtdVal',
    'nPreVal',
    'nFolBit',
    'nCveEmp',
    'dFecFac',
    'nEdoVal',
    
  ];

  startDate: string = ''; // Fecha de inicio (en formato string)
  endDate: string = ''; // Fecha de fin (en formato string)
  valeInfo: any; // Información del vale  


  constructor(
    public dialogRef: MatDialogRef<ValesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}


  ngOnInit(): void {
    this.verifyProductId();
    this.fetchProducts();
    
  }
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

//Metodo para obtener los productos
  fetchProducts(): void {
    this.apiService.getProducts().subscribe(
      (data) => {
        this.products = data;
        this.setProductDescription(); // Llamamos a esta función para asignar la descripción
      },
      (error) => {
        console.error('Error al obtener los productos:', error);
      }
    );
  }
  
  // Función para asignar la descripción del producto basado en productId
  setProductDescription(): void {
    const productId = this.data?.productId; // Suponiendo que tienes el productId en MAT_DIALOG_DATA
    if (productId) {
      const product = this.products.find(p => p.productId === productId);
      if (product) {
        this.productDescription = product.description; // Asigna la descripción
      } else {
        console.error('Producto no encontrado');
      }
    }
  }

//Metodo para verificar el id el producto
  verifyProductId(): void {
    console.log('Datos recibidos en el modal:', this.data);
    // Extraer y validar el productId
    const productId = this.data?.productId ? String(this.data.productId) : '';
    console.log('ProductId a enviar:', productId);
    if (!productId) {
      console.error('Error: productId no es válido o está vacío');
      return;
    }
    this.loadValesDetalles();  // Ahora solo llamas al método sin argumentos
  }

  applyValesNumberFilter(): void {
    const filterValue = this.filtervalesxNumber.trim().toLowerCase();
    if (filterValue) {
      this.filteredData = this.detalles.filter(item =>
        item.nnumval && String(item.nnumval).toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredData = [...this.detalles]; // Restablecer los datos originales si no hay filtro
    }
  }

  loadValesDetalles(): void {
    const productId = this.data?.productId; // Asegúrate de que productId esté disponible y válido
    if (!productId) {
      console.error('Error: El productId no está disponible');
      return;
    }
    const formattedStartDate = this.startDate ? new Date(this.startDate).toISOString() : '';
    const formattedEndDate = this.endDate ? new Date(this.endDate).toISOString() : '';
    this.loading.next(true);
    // Obtener los detalles del vale según productId y las fechas opcionales
    this.apiService.getValesDetalles(productId, formattedStartDate, formattedEndDate).subscribe(
      (data) => {
        this.detalles = data;
        this.filteredData = [...this.detalles]; // Copiar datos iniciales
        if (data.length > 0) {
          // Aquí no necesitas hacer más cosas porque el backend ya devolvió el nCveEmp con los detalles del vale
          this.loading.next(false); // Desactivar indicador de carga
        } else {
          console.log('No se encontraron detalles del vale.');
          this.loading.next(false); // Desactivar indicador de carga
        }
      },
      (error) => {
        console.error('Error al cargar los detalles del vale:', error);
        this.loading.next(false); // Desactivar indicador de carga
      }
    );
  }
  
  
  // Método para cerrar el modal
  close(): void {
    this.dialogRef.close();
  }


  exportToExcel(): void {
    // Mapeo de las columnas originales a nombres más legibles
    const columnMapping: { [key: string]: string } = {
      nnumval: 'Número Vale',
      cCodPrd: 'Código de Producto',
      nCtdVal: 'Cantidad',
      nPreVal: 'Precio',
      nFolBit: 'Folio Bitacora',
      nCveEmp: 'Empresa',
      cNumFac: 'Número Factura',
      dFecFac: 'Fecha Factura',
      nEdoVal: 'Estado'
     
    };
    const visibleData = this.filteredData || this.detalles; // Usar datos visibles si hay un filtro aplicado
    const exportData = visibleData.map(item => {
      let mappedItem: { [key: string]: any } = {};
      for (let key in item) {
        if (columnMapping.hasOwnProperty(key)) { // Verificamos si la clave está en el mapeo
          if (key === 'nEdoVal' ) {
            // Convertimos el tipo a su nombre correspondiente
            mappedItem[columnMapping[key]] = this.getEstadoVale(item[key]);
          } else if (key === 'nCveEmp') {
            // Lógica personalizada para `nCveEmp`
            mappedItem[columnMapping[key]] = this.getEmpresaVales(item[key]); // Ejemplo: convertir clave a nombre
          } 
          else if (key === 'dFecFac') {
            // Formatear la fecha
            mappedItem[columnMapping[key]] = this.datePipe.transform(item[key], 'dd-MM-yyyy');
          } 
          else {
            // Columnas estándar
            mappedItem[columnMapping[key]] = item[key];
          }
        }
      }
      return mappedItem;
    });
    

    // Convertir los datos mapeados a hoja de Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] }; // Crear el libro de trabajo
    const excelFileName = 'detalles_vales.xlsx'; // Nombre del archivo Excel
    XLSX.writeFile(wb, excelFileName); // Exportar el archivo
  }


  getEstadoVale(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'emitido';
      case 2:
        return 'entregado';
        case 3:
        return 'cancelado';
      case 4:
        return 'devolucion';
        case 5:
        return 'Sin Definir';
      case 6:
        return 'Sin Definir';
        case 7:
        return 'Sin Definir';
      case 8:
        return 'Sin Definir';
      default:
        return 'Desconocido'; // Para los valores que no son 1 ni 2
    }
  }


  getEmpresaVales(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'APV';
      case 2:
        return 'ESTRELLA';
        case 3:
        return 'OCSA';
      case 4:
        return 'Sin Definir';
        case 5:
        return 'ADVO';
      case 6:
        return 'OFG';
        case 7:
        return 'Sin Definir';
      case 8:
        return 'TLACO';
      default:
        return 'Desconocido'; // Para los valores que no son 1 ni 2
    }
  }
}
