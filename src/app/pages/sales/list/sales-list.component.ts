import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SalesItem } from '../../../model/sales.model';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.scss'
})
export class SalesListComponent {
  @Input() salesList: SalesItem[] = [];
  @Output() itemDeleted = new EventEmitter<number>();

  get grandTotal(): number {
    if (!this.salesList || this.salesList.length === 0) {
      return 0;
    }
    return this.salesList.reduce((accumulator, item) => accumulator + item.total, 0);
  }

  trackByProduct(index: number, item: SalesItem): string {
    // Create a unique identifier for each row for better @for performance
    return `${item.productId}-${index}`;
  }

  deleteItem(index: number): void {
    this.itemDeleted.emit(index);
  }
}