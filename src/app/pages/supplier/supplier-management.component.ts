import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter, Subject, switchMap, take, takeUntil } from 'rxjs';

import { Supplier } from '../../model/supplier.model';
import { SupplierService } from '../../core/services/supplier.service';
import { SupplierDialogComponent } from './supplier-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    ConfirmationDialogComponent,
  ],
  templateUrl: './supplier-management.component.html',
  styleUrl: './supplier-management.component.scss'
})
export class SupplierManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'contactPerson', 'phone', 'email', 'actions'];
  dataSource: MatTableDataSource<Supplier>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private destroy$ = new Subject<void>();

  constructor(
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Supplier>([]);
  }

  ngOnInit(): void {
    this.supplierService.getSuppliers().pipe(takeUntil(this.destroy$)).subscribe(suppliers => {
      this.dataSource.data = suppliers;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openSupplierDialog(supplier?: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '400px',
      data: supplier ? { ...supplier } : { id: 0, name: '', contactPerson: '', phone: '', email: '' }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result) {
        if (result.id) {
          // Update existing supplier
          this.supplierService.updateSupplier(result).pipe(take(1)).subscribe(() => {
            this.snackBar.open('Supplier updated successfully!', 'Close', { duration: 3000 });
          });
        } else {
          // Add new supplier
          this.supplierService.addSupplier(result).pipe(take(1)).subscribe(() => {
            this.snackBar.open('Supplier added successfully!', 'Close', { duration: 3000 });
          });
        }
      }
    });
  }

  deleteSupplier(id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: 'Are you sure you want to delete this supplier?' }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result), // Only proceed if the user confirmed
      switchMap(() => this.supplierService.deleteSupplier(id)),
      take(1)
    ).subscribe(() => {
      this.snackBar.open('Supplier deleted successfully!', 'Close', { duration: 3000 });
    });
  }
}