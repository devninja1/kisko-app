import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Sale } from '../../../model/sale.model';

@Component({
  selector: 'app-printable-receipt',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="receipt-container">
      <div class="header">
        <h2>Kisko App</h2>
        <p>Sale Receipt</p>
        <p>Date: {{ sale.date.toDate() | date:'short' }}</p>
        <p>Customer: {{ sale.customerName ?? 'N/A' }}</p>
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
        <tbody>
          @for (item of sale.items; track item.product.id) {
            <tr>
              <td>{{ item.product.name }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ item.product.unit_price | currency }}</td>
              <td class="text-right">{{ item.total | currency }}</td>
            </tr>
          }
        </tbody>
      </table>
      <div class="totals">
        <div class="total-row grand-total">
          <span>Grand Total:</span>
          <span>{{ sale.grandTotal | currency }}</span>
        </div>
      </div>
      <div class="footer">
        <p>Thank you for your business!</p>
      </div>
    </div>
  `,
  styleUrl: './printable-receipt.component.scss',
})
export class PrintableReceiptComponent {
  @Input({ required: true }) sale!: Sale;
}