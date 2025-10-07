import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Product } from '../../../model/product.model';
import { SalesItem } from '../../../model/sales.model';

@Component({
  selector: 'app-sales-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './sales-entry.component.html',
  styleUrl: './sales-entry.component.scss'
})
export class SalesEntryComponent implements OnInit {
  @ViewChild('quantityInput') quantityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('productSearchInput') productSearchInput!: ElementRef<HTMLInputElement>;

  @Input() products: Product[] = [];
  @Input() addedProductNames: Set<string> = new Set<string>();
  @Output() itemAdded = new EventEmitter<SalesItem>();

  productSearch = new FormControl<string | Product>('');
  filteredProducts!: Observable<Product[]>;
  selectedProduct: Product | null = null;
  quantity: number = 1;
  editableRate: number = 0;

  ngOnInit() {
    this.filteredProducts = this.productSearch.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value?.name ?? '')),
      map(name => (name ? this._filter(name) : this.products.slice())),
    );
  }

  private _filter(name: string): Product[] {
    const filterValue = name.toLowerCase();
    return this.products.filter(product => product.name.toLowerCase().includes(filterValue));
  }

  displayProduct(product: Product): string {
    return product && product.name ? product.name : '';
  }

  onProductSelected(event: any) {
    this.selectedProduct = event.option.value;
    if (this.selectedProduct) {
      this.quantity = 1;
      this.editableRate = this.selectedProduct.rate;

      setTimeout(() => {
        this.quantityInput.nativeElement.focus();
        this.quantityInput.nativeElement.select();
      }, 0);
    }
  }

  isProductAdded(productName: string): boolean {
    return this.addedProductNames.has(productName);
  }

  get totalAmount(): number {
    return this.selectedProduct ? this.editableRate * this.quantity : 0;
  }

  addItem() {
    if (!this.selectedProduct) {
      return;
    }

    this.itemAdded.emit({
      product: {
        ...this.selectedProduct,
        rate: this.editableRate,
      },
      quantity: this.quantity,
      total: this.totalAmount,
    });

    this.resetForm();
  }

  private resetForm() {
    this.selectedProduct = null;
    this.productSearch.setValue('');
    this.quantity = 1;
    this.editableRate = 0;

    // Set focus back to the product search input for the next entry
    this.productSearchInput.nativeElement.focus();
  }
}