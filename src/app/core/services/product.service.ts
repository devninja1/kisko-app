import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Product } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'Laptop Pro', rate: 1200, stock: 10 },
    { id: 2, name: 'Wireless Mouse', rate: 25, stock: 50 },
    { id: 3, name: 'Mechanical Keyboard', rate: 95, stock: 25 },
    { id: 4, name: '4K Monitor', rate: 450, stock: 15 },
    { id: 5, name: 'Webcam HD', rate: 60, stock: 30 },
  ];

  private products$ = new BehaviorSubject<Product[]>(this.products);

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  addProduct(productData: Omit<Product, 'id'>): void {
    const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
    const newProduct: Product = { id: newId, ...productData };
    this.products = [...this.products, newProduct];
    this.products$.next(this.products);
  }

  updateProduct(updatedProduct: Product): void {
    const index = this.products.findIndex(p => p.id === updatedProduct.id);
    if (index > -1) {
      this.products[index] = updatedProduct;
      this.products = [...this.products];
      this.products$.next(this.products);
    }
  }

  deleteProduct(id: number): void {
    this.products = this.products.filter(p => p.id !== id);
    this.products$.next(this.products);
  }

  updateStock(productName: string, quantityChange: number): void {
    const product = this.products.find(p => p.name === productName);
    if (product) {
      product.stock += quantityChange;
      this.products$.next([...this.products]);
    }
  }
}