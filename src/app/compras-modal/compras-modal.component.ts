import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../services/api.service';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-compras-modal',
  templateUrl: './compras-modal.component.html',
  styleUrls: ['./compras-modal.component.css']
})
export class ComprasModalComponent implements OnInit {
  ComprasDetails: any[] = [];
  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  products: any[] = [];
  filterText: string = '';
  filteredData: any[] = []; // Inicialmente vacía
  filterOrdenNumber: string = '';
  productDescription: string = ''; // Variable para almacenar la descripción
  displayedColumns: string[] = [
    'nNumOrd',
    'cPrvOrd',
    'nCtdOrd',
    'nCtoOrd',
    'nNumPed',
    'cFacOrd',
    'dFecFac',
    'nEdoOrd'
  ];

  startDate: string = '';
  endDate: string = '';


  constructor(
    public dialogRef: MatDialogRef<ComprasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) { }


  ngOnInit(): void {
    this.verifyProductId();
    this.fetchProducts();

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
  //Metodo para verificar el id del producto llege correctamente y abra el modal
  verifyProductId(): void {
    const productId = this.data?.productId ? String(this.data.productId) : '';
    if (!productId) {
      console.error('Error: productId no es válido o está vacío');
      return;
    }
    this.loadComprasDetails();
  }

  //Metodo para filtrar por numero de orden
  applyComprasNumberFilter(): void {
    const filterValue = this.filterOrdenNumber.trim().toLowerCase();
    if (filterValue) {
      this.filteredData = this.ComprasDetails.filter(item =>
        item.nNumOrd && String(item.nNumOrd).toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredData = [...this.ComprasDetails]; // Restablecer los datos originales si no hay filtro
    }
  }
  //Metodo para cargar los detalles de las compras
  loadComprasDetails(): void {
    const productId = this.data?.productId;  // Asegúrate de tener el productId aquí
    if (!productId) {
      console.error('Error: productId no es válido');
      return;
    }
    const formattedStartDate = this.startDate ? new Date(this.startDate).toISOString() : '';
    const formattedEndDate = this.endDate ? new Date(this.endDate).toISOString() : '';
    this.loading.next(true); // Activar indicador de carga
    this.apiService
      .getComprasDetails(productId, formattedStartDate, formattedEndDate)
      .subscribe(
        (data) => {
          this.ComprasDetails = data;
          this.filteredData = [...this.ComprasDetails]; // Copiar datos iniciales
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

  //Metodo para exportar datos en excel
  exportToExcel(): void {
    // Mapeo de las columnas originales a nombres más legibles
    const columnMapping: { [key: string]: string } = {
      nNumOrd: 'Número de Orden',
      cPrvOrd: 'Proveedor',
      cCodPrd: 'Código de Producto',
      nCtdOrd: 'Cantidad',
      nCtoOrd: 'Costo de Orden',
      nNumPed: 'Número de Pedido',
      cFacOrd: 'Factura de Orden',
      dFecFac: 'Fecha de Factura',
      nEdoOrd: 'Estado de Orden',
    };

    const visibleData = this.filteredData || this.ComprasDetails;

    const exportData = visibleData.map(item => {
      let mappedItem: { [key: string]: any } = {};
      for (let key in item) {
        if (columnMapping.hasOwnProperty(key)) {
          if (key === 'nEdoOrd') {
            // Lógica personalizada para `nEdoOrd`
            mappedItem[columnMapping[key]] = this.getEstadoCompra(item[key]);
          } else if (key === 'dFecFac') {
            // Formatear la fecha
            mappedItem[columnMapping[key]] = this.datePipe.transform(item[key], 'dd-MM-yyyy');
          } else {
            // Columnas estándar
            mappedItem[columnMapping[key]] = item[key];
          }
        }
      }
      return mappedItem;
    });

    // Convertir los datos mapeados a hoja de Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] }; // Crear el libro de trabajo
    const excelFileName = 'Orden_Detalles.xlsx'; // Nombre del archivo Excel
    XLSX.writeFile(wb, excelFileName); // Exportar el archivo
  }
  //Metodo para cambiar a string el esto de la compra dependiendo de su valor
  getEstadoCompra(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'Emitido';
      case 2:
        return 'Entregado';
      case 3:
        return 'Cancelado';
      case 4:
        return 'Traspaso';
      case 5:
        return 'DevolucionProv';
      default:
        return 'Desconocido'; // Para los valores que no son 1 ni 2
    }
  }
}

