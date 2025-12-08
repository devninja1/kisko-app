import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { Sale } from '../../../model/sale.model';
import { SalesService } from '../../../core/services/sales.service';
import { PrintableReceiptComponent } from './printable-receipt.component';

@Component({
  selector: 'app-sale-receipt-page',
  standalone: true,
  imports: [CommonModule, PrintableReceiptComponent],
  template: `
    @if (sale$ | async; as sale) {
      <app-printable-receipt [sale]="sale" />
    } @else {
      <p>Loading receipt...</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleReceiptPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private salesService = inject(SalesService);

  sale$!: Observable<Sale | undefined>;

  ngOnInit(): void {
    this.sale$ = this.route.queryParamMap.pipe(
      switchMap(params => {
        const saleId = params.get('id');
        console.log('Fetching sale with ID:', saleId);
        if (!saleId) {
          // Handle case where ID is missing
          return EMPTY;
        }

        // We need a method in SalesService to get a single sale by ID.
        // Since it doesn't exist, we'll filter the full list for now.
        let saleObj = this.salesService.getSaleById(saleId);
        console.log('Fetched sale object:', saleObj);
        return saleObj;
      }),
      tap(sale => {
        if (sale) {
          document.title = `Receipt - Sale #${sale.invoiceId}`;
          // Wait for the content to be rendered, then print.
          setTimeout(() => window.print(), 500);
        }
      })
    );
  }
}