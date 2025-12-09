import { AfterViewInit, Component, DestroyRef, OnInit, signal, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// import { animate, state, style, transition, trigger } from '@angular/animations';
import { catchError, EMPTY, filter, tap } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Sale } from '../../model/sale.model';
import { Payment } from '../../model/purchase.model';
import { SalesItem } from '../../model/sales.model';
import { SalesService } from '../../core/services/sales.service';
import { SalesPaymentDialogComponent } from './sales-payment-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PrintableReceiptComponent } from '../sales/print/printable-receipt.component';

export interface SaleHistoryView extends Sale {
  balance: number;
}

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatPaginatorModule, MatDialogModule, MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './sales-history.component.html',
  styleUrl: './sales-history.component.scss',
  // animations: [
  //   trigger('detailExpand', [
  //     state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
  //     state('expanded', style({ height: '*' })),
  //     transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  //   ]),
  // ],
})
export class SalesHistoryComponent implements OnInit, AfterViewInit {
  dataSource: MatTableDataSource<SaleHistoryView>;
  columnsToDisplay = ['expand', 'invoiceId', 'customer', 'date', 'grandTotal', 'amountPaid', 'balance', 'actions'];
  expandedId =  signal<number | null>(null);
  isLoading = true;
  private originalData: SaleHistoryView[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroyRef = inject(DestroyRef);
  private saleService = inject(SalesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor() {
    this.dataSource = new MatTableDataSource<SaleHistoryView>([]);
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: Sale, filter: string) => {
      if (!filter) return true;
      const { start, end } = JSON.parse(filter);
      if (!start || !end) return true;

      const saleDate = data.date.toDate();
      // Create new date objects to avoid mutating original data
      const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
      const startDate = new Date(start); // The filter already has time set to 0
      const endDate = new Date(end); // The filter already has time set to 0

      return saleDay >= startDate && saleDay <= endDate;
    };

    this.saleService.getSales()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          // The data stream has emitted, so we can turn off the loading indicator.
          if (this.isLoading) {
            this.isLoading = false;
          }
        })
      )
      .subscribe(sales => {
      // Sort sales by most recent first
      const salesHistory = sales.map(s => {
        const amountPaid = s.amountPaid ?? 0;
        return {
          ...s,
          balance: s.grandTotal - amountPaid,
        } as SaleHistoryView;
      });
      this.originalData = salesHistory.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      this.dataSource.data = this.originalData;

      // Check for initial query params after data is loaded
      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
        const start = params.get('start');
        const end = params.get('end');
        if (start && end) {
          this.range.setValue({
            start: new Date(start),
            end: new Date(end)
          }, { emitEvent: false }); // Prevent valueChanges from firing again
          this.applyDateFilter();
        }
      });
    });

    this.range.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.applyDateFilter();
      this.updateUrlQueryParams();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  clearDateFilter(): void {
    this.range.reset();
    // The valueChanges subscription will handle filtering and URL update
  }

  private applyDateFilter(): void {
    const { start, end } = this.range.value;
    this.dataSource.filter = (start && end) ? JSON.stringify({ start, end }) : '';
  }

  private updateUrlQueryParams(): void {
    const { start, end } = this.range.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        start: start ? start.toISOString().split('T')[0] : null,
        end: end ? end.toISOString().split('T')[0] : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  addPayment(sale: SaleHistoryView): void {
    const dialogRef = this.dialog.open(SalesPaymentDialogComponent, {
      width: '400px',
      data: { balance: sale.balance },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paymentAmount => {
      if (paymentAmount && paymentAmount > 0) {
        this.saleService.addPayment(sale.id, paymentAmount).pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(err => this.handleError(err, 'Failed to record payment.'))
        ).subscribe(() => this.showSuccess('Payment recorded successfully!'));
      }
    });
  }

  editPayment(sale: SaleHistoryView, paymentToEdit: Payment): void {
    const dialogRef = this.dialog.open(SalesPaymentDialogComponent, {
      width: '400px',
      data: {
        balance: sale.balance + paymentToEdit.amount,
        paymentAmount: paymentToEdit.amount,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(newAmount => {
      if (newAmount && newAmount > 0 && newAmount !== paymentToEdit.amount) {
        this.saleService.updatePayment(sale.id, paymentToEdit, newAmount).pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(err => this.handleError(err, 'Failed to update payment.'))
        ).subscribe(() => this.showSuccess('Payment updated successfully!'));
      }
    });
  }

  deletePayment(sale: SaleHistoryView, paymentToDelete: Payment): void {
    const currencyPipe = new CurrencyPipe('en-US', 'INR');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete this payment of ${currencyPipe.transform(paymentToDelete.amount, 'INR', 'symbol')}?`,
      },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result), // Only proceed if the user confirmed
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
        this.saleService.deletePayment(sale.id, paymentToDelete)
          .pipe(catchError(err => this.handleError(err, 'Failed to delete payment.')))
          .subscribe(() => this.showSuccess('Payment deleted successfully!'));
    });
  }

  deleteSale(sale: SaleHistoryView): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Permanent Deletion',
        message: `Are you sure you want to permanently delete Sale #${sale.invoiceId}? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result), // Only proceed if the user confirmed
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.saleService.deleteSale(sale.id)
        .pipe(catchError(err => this.handleError(err, 'Failed to delete sale.')))
        .subscribe(() => this.showSuccess('Sale deleted successfully!'));
    });
  }

  private handleError(error: any, message: string) {
    console.error(error);
    this.snackBar.open(message, 'Close', { duration: 3000 });
    return EMPTY;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'success-snackbar' });
  }

  printReceipt(sale: Sale): void {
    // Construct the URL for the dedicated print route
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/printSale'], { queryParams: { id: sale.id } })
    );

    // Open the URL in a new tab. The SaleReceiptPageComponent will handle the printing.
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      this.snackBar.open('Could not open print window. Please disable your pop-up blocker.', 'Close', { duration: 5000 });
    }
  }

  trackByProduct(index: number, item: SalesItem): string {
    return item.productId.toString();
  }

   toggleRow(rowId: number) {
    this.expandedId.set(this.expandedId() === rowId ? null : rowId);
  }

}