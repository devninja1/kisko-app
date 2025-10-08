import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Sale } from '../../model/sale.model';
import { SalesService } from '../../core/services/sales.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './sales-history.component.html',
  styleUrl: './sales-history.component.scss',
})
export class SalesHistoryComponent implements OnInit {
  dataSource: MatTableDataSource<Sale>;
  columnsToDisplay = ['expand', 'id', 'customer', 'date', 'grandTotal', 'actions'];
  expandedElement: Sale | null = null;

  constructor(private salesService: SalesService) {
    this.dataSource = new MatTableDataSource<Sale>([]);
  }

  ngOnInit(): void {
    this.salesService.getSales().subscribe(sales => {
      // Sort sales by most recent first
      this.dataSource.data = sales.sort((a, b) => b.id - a.id);
    });
  }

  printReceipt(sale: Sale): void {
    const currencyPipe = new CurrencyPipe('en-US');
    const datePipe = new DatePipe('en-US');

    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${currencyPipe.transform(item.product.rate)}</td>
        <td class="text-right">${currencyPipe.transform(item.total)}</td>
      </tr>
    `).join('');

    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Sale #${sale.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
            .receipt-container { width: 320px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 0; }
            .header p { margin: 2px 0; font-size: 12px; }
            .items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .items-table th, .items-table td { padding: 6px; text-align: left; border-bottom: 1px dashed #ccc; }
            .items-table th { font-weight: 600; }
            .items-table .text-right { text-align: right; }
            .totals { margin-top: 20px; }
            .totals .total-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
            .totals .grand-total { font-weight: bold; font-size: 16px; border-top: 1px solid #333; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h2>Kisko App</h2>
              <p>Sale Receipt</p>
              <p>Date: ${datePipe.transform(sale.date, 'short')}</p>
              <p>Customer: ${sale.customer?.name ?? 'N/A'}</p>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="totals">
              <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>${currencyPipe.transform(sale.grandTotal)}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(receiptContent);
    printWindow?.document.close();
    printWindow?.print();
  }
}