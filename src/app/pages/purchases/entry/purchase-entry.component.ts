import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Product } from '../../../model/product.model';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseItem } from '../../../model/purchase.model';

@Component({
  selector: 'app-purchase-entry',
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
  templateUrl: './purchase-entry.component.html',
  styleUrl: './purchase-entry.component.scss'
})
export class PurchaseEntryComponent implements OnInit {
  @ViewChild('quantityInput') quantityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('productSearchInput') productSearchInput!: ElementRef<HTMLInputElement>;

  @Output() itemAdded = new EventEmitter<PurchaseItem>();

  private productService = inject(ProductService);

  products: Product[] = [];
  addedProductNames: Set<string> = new Set<string>();
  productSearch = new FormControl<string | Product>('');
  filteredProducts!: Observable<Product[]>;
  selectedProduct: Product | null = null;
  quantity: number = 1;
  editableCostPrice: number = 0;


  ngOnInit() {
    const products$ = this.productService.getProducts().pipe(
      tap(products => this.products = products)
    );

    const filter$ = this.productSearch.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value?.name ?? ''))
    );

    this.filteredProducts = combineLatest([products$, filter$]).pipe(
      map(([products, filterValue]) => this._filter(filterValue, products))
    );
  }

  private _filter(name: string, products: Product[]): Product[] {
    if (!name) {
      return products.slice();
    }
    const filterValue = name.toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(filterValue));
  }

  displayProduct(product: Product): string {
    return product?.name ?? '';
  }

  onProductSelected(event: any) {
    this.selectedProduct = event.option.value;
    if (this.selectedProduct) {
      this.quantity = 1;
      this.editableCostPrice = this.selectedProduct.cost_price;

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
    return this.selectedProduct ? this.editableCostPrice * this.quantity : 0;
  }

  addItem() {
    if (!this.selectedProduct) {
      return;
    }

    this.itemAdded.emit({
      product: {
        ...this.selectedProduct,
        cost_price: this.editableCostPrice,
      },
      quantity: this.quantity,
      cost_price: this.editableCostPrice,
      total: this.totalAmount,
    });

    this.resetForm();
  }

  private resetForm() {
    this.selectedProduct = null;
    this.productSearch.setValue('');
    this.quantity = 1;
    this.editableCostPrice = 0;

    this.productSearchInput.nativeElement.focus();
  }
}