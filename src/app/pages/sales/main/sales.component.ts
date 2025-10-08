import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

// Child Components
import { SalesEntryComponent } from '../entry/sales-entry.component';
import { SalesListComponent } from '../list/sales-list.component';
import { Product } from '../../../model/product.model';
import { SalesItem } from '../../../model/sales.model';
import { ProductService } from '../../../core/services/product.service';

// Main Component
@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, SalesEntryComponent, SalesListComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  products$: Observable<Product[]>;
  salesList: SalesItem[] = [];
  addedProductNames = new Set<string>();

  constructor(private productService: ProductService) {
    this.products$ = this.productService.getProducts();
  }

  ngOnInit(): void {}

  onItemAdded(newItem: SalesItem) {
    // Decrease stock from the master product list
    this.productService.updateStock(newItem.product.name, -newItem.quantity);

    const existingItemIndex = this.salesList.findIndex(
      (saleItem) => saleItem.product.name === newItem.product.name
    );

    if (existingItemIndex > -1) {
      // Product already exists, so we update it
      const updatedSalesList = [...this.salesList];
      const existingItem = updatedSalesList[existingItemIndex];

      // Update quantity, rate, and total
      existingItem.quantity += newItem.quantity;
      existingItem.product.rate = newItem.product.rate; // Use the latest rate
      existingItem.total = existingItem.product.rate * existingItem.quantity;

      this.salesList = updatedSalesList;
    } else {
      // Product is new, add it to the list
      this.salesList = [...this.salesList, newItem];
      this.addedProductNames.add(newItem.product.name);
    }
  }

  onItemDeleted(index: number) {
    const deletedItem = this.salesList[index];
    if (deletedItem) {
      this.productService.updateStock(deletedItem.product.name, deletedItem.quantity);

      this.addedProductNames.delete(deletedItem.product.name);
      // Create a new array to ensure change detection is triggered
      this.salesList = this.salesList.filter((_, i) => i !== index);
    }
  }
}