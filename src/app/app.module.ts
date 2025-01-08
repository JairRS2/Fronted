import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule,  ReactiveFormsModule  } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductsComponent } from './components/products/products.component';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { LoginComponent } from './components/login/login.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgxPaginationModule } from 'ngx-pagination';
import { ValesModalComponent } from './vales-modal/vales-modal.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { KardexModalComponent } from './kardex-modal/kardex-modal.component';
import { ComprasModalComponent } from './compras-modal/compras-modal.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HomeComponent } from './components/home/home.component';
import { DxPivotGridModule, DxButtonModule } from 'devextreme-angular';
import { PivotGridComponent } from './components/pivot-grid/pivot-grid.component';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, DatePipe } from '@angular/common';
import { ImageModalComponentComponent } from './image-modal-component/image-modal-component.component';




@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent,
    ConfirmDialogComponent,
    LoginComponent,
    ValesModalComponent,
    KardexModalComponent,
    ComprasModalComponent,
    HomeComponent,
    PivotGridComponent,
    ImageModalComponentComponent,
 
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatTableModule,
    MatDialogModule,
    MatSidenavModule,
    MatButtonModule,
    NgxPaginationModule,
    DxPivotGridModule,
    DxButtonModule,
    MatSnackBarModule,
    MatSelectModule,
    CommonModule

    
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
