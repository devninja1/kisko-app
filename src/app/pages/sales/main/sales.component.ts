import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Child Components
import { SalesEntryComponent } from '../entry/sales-entry.component';
import { SalesListComponent } from '../list/sales-list.component';
import { Product } from '../../../model/product.model';
import { SalesItem } from '../../../model/sales.model';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, SalesEntryComponent, SalesListComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent {
  products: Product[] = [
    { name: 'Laptop Pro', rate: 1200, stock: 10 },
    { name: 'Wireless Mouse', rate: 25, stock: 50 },
    { name: 'Mechanical Keyboard', rate: 95, stock: 25 },
    { name: '4K Monitor', rate: 450, stock: 15 },
    { name: 'Webcam HD', rate: 60, stock: 30 },
  ];

  salesList: SalesItem[] = [];
  addedProductNames = new Set<string>();

  onItemAdded(newItem: SalesItem) {
    // Find the product in the master list to update its stock
    const productInMasterList = this.products.find(p => p.name === newItem.product.name);
    if (!productInMasterList) {
      console.error('Product not found in master list:', newItem.product.name);
      return;
    }

    // Decrease stock from the master product list
    productInMasterList.stock -= newItem.quantity;

    // Create a new array reference for products to trigger change detection in the child component
    this.products = [...this.products];

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
      // Find the product in the master list to return its stock
      const productInMasterList = this.products.find(p => p.name === deletedItem.product.name);
      if (productInMasterList) {
        productInMasterList.stock += deletedItem.quantity;
        // Create a new array reference for products to trigger change detection
        this.products = [...this.products];
      }

      this.addedProductNames.delete(deletedItem.product.name);
      // Create a new array to ensure change detection is triggered
      this.salesList = this.salesList.filter((_, i) => i !== index);
    }
  }
}