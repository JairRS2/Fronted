import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../services/api.service';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-kardex-modal',
  templateUrl: './kardex-modal.component.html',
  styleUrls: ['./kardex-modal.component.css'],
})
export class KardexModalComponent implements OnInit {
  kardexDetails: any[] = [];
  productDescription: string = ''; // Variable para almacenar la descripción
  filterKardexNumber: string = '';
  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterText: string = '';
  products: any[] = [];
  filteredData: any[] = []; // Inicialmente vacía
  displayedColumns: string[] = [
    'nNumKdx',
    'cDocKdx',      
    'nCtdKdx',
    'dFecKdx',
    'nCveEmp',
    'cPrvKdx',
    'nCtoKdx',
    'nTpoKdx',
    'nSdoKdx',
    'nExiKdx',
    
  ];

  startDate: string = '';
  endDate: string = '';

  constructor(
    public dialogRef: MatDialogRef<KardexModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}


  ngOnInit(): void {
    this.verifyProductId();
    this.fetchProducts();
    
  }

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
  //Metood para verificar que llegue el id del producto correspondiente y abrir el modal
  verifyProductId(): void {
    const productId = this.data?.productId ? String(this.data.productId) : '';
    if (!productId) {
      console.error('Error: productId no es válido o está vacío');
      return;
    }
    this.loadKardexDetails();
  }
  //metodo para aplicar el filtro de busqueda por numero de kardex
  applyKardexNumberFilter(): void {
    const filterValue = this.filterKardexNumber.trim().toLowerCase();
    if (filterValue) {
      this.filteredData = this.kardexDetails.filter(item =>
        item.nNumKdx && String(item.nNumKdx).toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredData = [...this.kardexDetails]; // Restablecer los datos originales si no hay filtro
    }
  }
//Metodo para cargar los detalles del kardex
  loadKardexDetails(): void {
    const productId = this.data?.productId;  // Asegúrate de tener el productId aquí
    if (!productId) {
      return;
    }
    const formattedStartDate = this.startDate ? new Date(this.startDate).toISOString() : '';
    const formattedEndDate = this.endDate ? new Date(this.endDate).toISOString() : '';
    this.loading.next(true);
    this.apiService
      .getKardexDetails(productId, formattedStartDate, formattedEndDate)
      .subscribe(
        (data) => {
          this.kardexDetails = data;
          this.filteredData = [...this.kardexDetails]; // Copiar datos iniciales
          if (data.length > 0) {
            // Aquí no necesitas hacer más cosas porque el backend ya devolvió el nCveEmp con los detalles del vale
            this.loading.next(false); // Desactivar indicador de carga
          } else {
            console.log('No se encontraron detalles del kardex.');
            this.loading.next(false); // Desactivar indicador de carga
          }
        },
        (error) => {
          console.error('Error al cargar los detalles:', error);
          this.loading.next(false); // Desactivar indicador de carga
        }
      );
  }


  close(): void {
    this.dialogRef.close();
  }

//Metodo para realizar la exportacion a excel
  exportToExcel(): void {
    // Mapeo de las columnas originales a nombres más legibles
    const columnMapping: { [key: string]: string } = {
      nNumKdx: 'Numero de Kardex',
      cCodPrd: 'Código Producto',
      cDocKdx: 'Documento Kardex',
      nCtdKdx: 'Cantidad',
      dFecKdx: 'Fecha Kardex',
      nCveEmp: 'Clave Empresa',
      cPrvKdx: 'Proveedor',
      nCtoKdx: 'Costo',
      nTpoKdx: 'Tipo',
      nSdoKdx: 'Saldo',
      nExiKdx: 'Existencia',
      
    };
    const visibleData = this.filteredData || this.kardexDetails; // Usar datos visibles si hay un filtro aplicado
    const exportData = visibleData.map(item => {
      let mappedItem: { [key: string]: any } = {};
      for (let key in item) {
        if (columnMapping.hasOwnProperty(key)) {
          // Lógica personalizada para `nTpoKdx`
          if (key === 'nTpoKdx') {
            mappedItem[columnMapping[key]] = this.getTipoKardex(item[key]);
          }
          // Lógica personalizada para `nCveEmp` 
          else if (key === 'nCveEmp') {
            
            mappedItem[columnMapping[key]] = this.getEmpresaKardex(item[key]); // Ejemplo: convertir clave a nombre
          } 
          else if (key === 'dFecKdx') {
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
    const excelFileName = 'detalles_Kardex.xlsx'; // Nombre del archivo Excel
    XLSX.writeFile(wb, excelFileName); // Exportar el archivo
  }
  
//Metodo para cambiar a string el tipo de kardex dependiendo de su valor
   getTipoKardex(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'Entrada';
      case 2:
        return 'Salida';
        case 3:
        return 'Devolucion';
      case 4:
        return 'TraspasoEnt';
        case 5:
        return 'TraspasoSal';
      case 6:
        return 'AjusteEnt';
        case 7:
        return 'AjusteSal';
      case 8:
        return 'DevolucionProv';
      default:
        return 'Desconocido'; // Para los valores que no son 1 ni 2
    }
  }

  //Metodo para cambiar a string la empresa del kardex dependiendo de su valor
  getEmpresaKardex(tipo: number): string {
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
