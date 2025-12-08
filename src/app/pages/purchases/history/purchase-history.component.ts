import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, combineLatest, EMPTY, map, Subject, takeUntil } from 'rxjs';

import { Payment, Purchase } from '../../../model/purchase.model';
import { Supplier } from '../../../model/supplier.model';
import { PurchaseService } from '../../../core/services/purchase.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { PaymentDialogComponent } from './payment-dialog.component';

export interface PurchaseHistoryView extends Purchase {
  supplierName: string;
  balance: number;
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
    MatSnackBarModule,
    MatDialogModule   
  ],
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.scss'],
})
export class PurchaseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  columnsToDisplay: string[] = ['date', 'supplierName', 'grandTotal', 'amountPaid', 'balance', 'actions'];
  dataSource = new MatTableDataSource<PurchaseHistoryView>([]);
  expandedElement: PurchaseHistoryView | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private destroy$ = new Subject<void>();

  constructor(
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    combineLatest([
      this.purchaseService.getPurchases(),
      this.supplierService.getSuppliers()
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([purchases, suppliers]) => {
      const purchaseHistory = purchases.map((p: Purchase) => {
        const amountPaid = p.amountPaid ?? 0;
        const balance = p.grandTotal - amountPaid;
        return {
          ...p,
          balance,
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

  printReceipt(): void {
    window.print();
  }

  markAsPaid(purchase: PurchaseHistoryView): void {
    this._addPayment(purchase, purchase.balance, 'Purchase marked as fully paid!', 'Failed to mark as paid.');
  }

  addPayment(purchase: PurchaseHistoryView): void {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: { balance: purchase.balance, grandTotal: purchase.grandTotal },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(paymentAmount => {
      if (paymentAmount && paymentAmount > 0) {
        this._addPayment(purchase, paymentAmount, 'Payment recorded successfully!', 'Failed to record payment.');
      }
    });
  }

  editPayment(purchase: PurchaseHistoryView, paymentToEdit: Payment): void {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: {
        balance: purchase.balance + paymentToEdit.amount, // The max allowable amount is the current balance plus the amount of the payment being edited
        grandTotal: purchase.grandTotal,
        paymentAmount: paymentToEdit.amount
      },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(newAmount => {
      if (newAmount && newAmount > 0 && newAmount !== paymentToEdit.amount) {
        this.purchaseService.updatePayment(purchase.id, paymentToEdit, newAmount).pipe(
          takeUntil(this.destroy$),
          catchError(err => {
            this.snackBar.open('Failed to update payment.', 'Close', { duration: 3000 });
            console.error(err);
            return EMPTY;
          })
        ).subscribe(() => this.snackBar.open('Payment updated successfully!', 'Close', { duration: 3000, panelClass: 'success-snackbar' }));
      }
    });
  }

  deletePayment(purchase: PurchaseHistoryView, paymentToDelete: Payment): void {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.purchaseService.deletePayment(purchase.id, paymentToDelete).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.snackBar.open('Failed to delete payment.', 'Close', { duration: 3000 });
          console.error(err);
          return EMPTY;
        })
      ).subscribe(() => this.snackBar.open('Payment deleted successfully!', 'Close', { duration: 3000, panelClass: 'success-snackbar' }));
    }
  }

  private _addPayment(purchase: PurchaseHistoryView, amount: number, successMessage: string, errorMessage: string): void {
    this.purchaseService.addPayment(purchase.id, amount).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        console.error(err);
        return EMPTY;
      })
    ).subscribe(() => {
      this.snackBar.open(successMessage, 'Close', { duration: 3000, panelClass: 'success-snackbar' });
    });
  }
}