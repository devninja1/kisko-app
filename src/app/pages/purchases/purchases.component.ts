import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { Product } from '../../model/product.model';
import { Supplier } from '../../model/supplier.model';
import { PurchaseItem } from '../../model/purchase.model';
import { PurchaseService } from '../../core/services/purchase.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PurchaseEntryComponent } from './entry/purchase-entry.component';
import { PurchaseListComponent } from './list/purchase-list.component';
@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Added for dialog forms, though not directly used in PurchasesComponent itself
    FormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PurchaseEntryComponent,
    PurchaseListComponent,
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss',
})
export class PurchasesComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  suppliers$: Observable<Supplier[]>;
  purchaseList: PurchaseItem[] = [];
  addedProductNames = new Set<string>();
  selectedSupplierId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private purchaseService: PurchaseService,
    private snackBar: MatSnackBar
  ) {
    this.products$ = this.productService.getProducts();
    this.suppliers$ = this.supplierService.getSuppliers();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get grandTotal(): number {
    if (!this.purchaseList || this.purchaseList.length === 0) {
      return 0;
    }
    return this.purchaseList.reduce((acc, item) => acc + item.total, 0);
  }

  onItemAdded(newItem: PurchaseItem) {
    // When a purchase is made, the stock increases.
    this.productService.updateStock(newItem.product.id, newItem.quantity).pipe(takeUntil(this.destroy$)).subscribe();
    this.purchaseList = [...this.purchaseList, newItem];
    this.addedProductNames.add(newItem.product.name);
  }

  onItemDeleted(index: number) {
    const deletedItem = this.purchaseList[index];
    if (deletedItem) {
      // When a purchase item is removed, the stock decreases.
      this.productService.updateStock(deletedItem.product.id, -deletedItem.quantity).pipe(takeUntil(this.destroy$)).subscribe();
      this.addedProductNames.delete(deletedItem.product.name);
      this.purchaseList = this.purchaseList.filter((_, i: number) => i !== index);
    }
  }

  savePurchase() {
    if (this.purchaseList.length === 0) {
      this.snackBar.open('No items to save in purchase!', 'Close', { duration: 3000 });
      return;
    }

    this.purchaseService
      .savePurchase({
        items: this.purchaseList,
        grandTotal: this.grandTotal,
        supplierId: this.selectedSupplierId,
        date: new Date(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('Purchase saved successfully!', 'Close', { duration: 3000 });
        this.purchaseList = [];
        this.selectedSupplierId = null;
        this.addedProductNames.clear();
      });
  }
}
