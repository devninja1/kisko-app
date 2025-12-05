import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';

import { Purchase } from '../../../model/purchase.model';
import { Supplier } from '../../../model/supplier.model';
import { PurchaseService } from '../../../core/services/purchase.service';
import { SupplierService } from '../../../core/services/supplier.service';

export interface PurchaseHistoryView extends Purchase {
  supplierName: string;
}

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.scss'],
})
export class PurchaseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  columnsToDisplay: string[] = ['date', 'supplierName', 'grandTotal'];
  dataSource = new MatTableDataSource<PurchaseHistoryView>([]);
  expandedElement: PurchaseHistoryView | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private destroy$ = new Subject<void>();

  constructor(
    private purchaseService: PurchaseService,
    private supplierService: SupplierService
  ) {
  }

  ngOnInit(): void {
    combineLatest([
      this.purchaseService.getPurchases(),
      this.supplierService.getSuppliers()
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([purchases, suppliers]) => {
      const purchaseHistory = purchases.map(p => {
        return {
          ...p,
          supplierName: p.supplier?.name ?? 'N/A'
        } as PurchaseHistoryView;
      });
      this.dataSource.data = purchaseHistory;
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
  }
}