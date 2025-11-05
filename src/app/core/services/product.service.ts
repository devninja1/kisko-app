import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, switchMap, tap, map, BehaviorSubject, concatMap } from 'rxjs';
import { NgxIndexedDBService, WithID } from 'ngx-indexed-db';
import { Product } from '../../model/product.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';
  private isOnline = navigator.onLine;
  private products$ = new BehaviorSubject<Product[]>([]);
  private defaultProducts: Product[] = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', description: 'A powerful laptop for professionals', unit_price: 1200, cost_price: 950, stock: 10, is_active: true },
    { id: 2, name: 'Wireless Mouse', category: 'Accessories', description: 'Ergonomic wireless mouse', unit_price: 25, cost_price: 15, stock: 50, is_active: true },
    { id: 3, name: 'Mechanical Keyboard', category: 'Accessories', description: 'RGB Mechanical Keyboard', unit_price: 95, cost_price: 60, stock: 25, is_active: false },
    { id: 4, name: '4K Monitor', category: 'Electronics', description: '27-inch 4K UHD Monitor', unit_price: 450, cost_price: 350, stock: 15, is_active: true },
    { id: 5, name: 'Webcam HD', category: 'Accessories', description: '1080p HD Webcam for streaming', unit_price: 60, cost_price: 40, stock: 30, is_active: true },
  ];

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService
  ) {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    this.loadInitialData();
  }

  private loadInitialData() {
    this.dbService.count('products').subscribe(count => {
      if (count === 0) {
        // DB is empty, populate with default data first.
        this.dbService.bulkAdd<Product>('products', this.defaultProducts).subscribe(() => {
          this.products$.next(this.defaultProducts);
          if (this.isOnline) this.syncWithApi();
        });
      } else {
        // DB has data, load it and then sync if online.
        this.dbService.getAll<Product>('products').subscribe(prods => {
          this.products$.next(prods);
          if (this.isOnline) this.syncWithApi();
          });
      }
    });
  }

  private syncWithApi() {
    this.http.get<Product[]>(this.apiUrl).subscribe((products: Product[]) => {
      // Only clear the local DB after successfully fetching from the API
      if (products) {
        this.dbService.clear('products').subscribe(() => {
          this.dbService.bulkAdd<Product>('products', products).subscribe(() => {
            this.dbService.getAll<Product>('products').subscribe(prods => this.products$.next(prods));
          });
        });
      }
    });
  }

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  addProduct(productData: Omit<Product, 'id'>): Observable<Product> {
    // Optimistic update: add to local DB immediately with a temporary ID
    const tempId = -Date.now();
    const tempProduct: Product = {
      ...productData,
      id: tempId,
      cost_price: productData.cost_price || 0,
      stock: productData.stock || 0,
      is_active: productData.is_active ?? true,
      description: productData.description || '',
      unit_price: productData.unit_price || 0,
      category: productData.category || '',
      name: productData.name || '',
    };

    return from(this.dbService.add<Product>('products', tempProduct)).pipe(
      tap(() => {
        const currentProducts = this.products$.getValue();
        this.products$.next([...currentProducts, tempProduct]);
        this.syncService.addToQueue({ url: this.apiUrl, method: 'POST', payload: { ...productData, tempId } });
      }),
      map(() => tempProduct)
    );
  }

  updateProduct(updatedProduct: Product): Observable<Product> {
    this.syncService.addToQueue({ url: `${this.apiUrl}/${updatedProduct.id}`, method: 'PUT', payload: updatedProduct });
    return from(this.dbService.update<Product>('products', updatedProduct)).pipe(tap(() => {
      // Optimistically update the local BehaviorSubject
      const currentProducts = this.products$.getValue();
      const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        currentProducts[index] = updatedProduct;
        this.products$.next([...currentProducts]);
      }
    }), switchMap(() => of(updatedProduct)));
  }

  deleteProduct(id: number): Observable<void> {
    this.syncService.addToQueue({ url: `${this.apiUrl}/${id}`, method: 'DELETE', payload: null });
    return from(this.dbService.delete('products', id)).pipe(tap(() => {
      const currentProducts = this.products$.getValue();
      const updatedProducts = currentProducts.filter(p => p.id !== id);
      this.products$.next(updatedProducts);
    }),
      map(() => undefined)
    );
  }

  updateStock(productId: number, quantityChange: number): Observable<Product | undefined> {
    return from(this.dbService.getByID<Product>('products', productId)).pipe(
      concatMap((product) => {
        if (product) {
          const updatedProduct = { ...product, stock: product.stock + quantityChange };
          this.syncService.addToQueue({
            url: `${this.apiUrl}/${productId}/stock`, method: 'PATCH', payload: { change: quantityChange }
          });
          return from(this.dbService.update<Product>('products', updatedProduct)).pipe(map(() => updatedProduct));
        }
        return of(undefined);
      }),
      tap((updatedProduct) => {
        if (updatedProduct) {
          const currentProducts = this.products$.getValue();
          const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            currentProducts[index] = updatedProduct;
            this.products$.next([...currentProducts]);
          }
        }
      })
    );
  }
}