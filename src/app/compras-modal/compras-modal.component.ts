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

//metodo para inicializar todo
  ngOnInit(): void {
    this.verifyProductId();
    this.fetchProducts();

  }
//Metodo para detallar los productos
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
  //Metodo para cambiar a string el estado de la compra dependiendo de su valor
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
//Metodo para cambiar a string el nombre del proveedor dependiendo de su valor numerico
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
        return proveedorID;

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

