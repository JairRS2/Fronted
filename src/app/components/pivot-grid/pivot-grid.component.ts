import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-pivot-grid',
  templateUrl: './pivot-grid.component.html',
  styleUrls: ['./pivot-grid.component.css']
})
export class PivotGridComponent implements OnInit {
  dataSource: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }
//metodo para cargar los productos para el pivot grid
  loadData(): void {
    this.apiService.getProducts().subscribe(
      (data) => {
        // Transformar datos si es necesario
        this.dataSource = data.map((item: any) => ({
          descripcion: item.cDesPrd,
          costo: item.nCosPrd,
          InventarioActual: item.nInvAPrd,
          Lineas: item.nLinPrd || 'Sin categoría' // Ajustar según los datos reales
        }));
      },
      (error) => {
        console.error('Error al cargar datos:', error);
      }
    );
  }
//metodo par exportar datos a excel de las respectivas tablas
  exportToExcel(): void {
    // Lógica para exportar a Excel
  }
}
