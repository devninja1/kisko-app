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
    if (this.isOnline) {
      this.http.get<Product[]>(this.apiUrl).subscribe((products: Product[]) => {
        this.dbService.clear('products').subscribe(() => {
          this.dbService.bulkAdd<Product>('products', products).subscribe(() => {
            this.dbService.getAll<Product>('products').subscribe(prods => this.products$.next(prods));
          });
        });
      });
    } else {
      this.dbService.getAll<Product>('products').subscribe(prods => this.products$.next(prods));
    }
  }

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  addProduct(productData: Omit<Product, 'id'>): Observable<Product> {
    // Optimistic update: add to local DB immediately with a temporary ID
    const tempId = -Date.now();
    const tempProduct: Product = { ...productData, id: tempId, stock: productData.stock || 0 };

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
    return from(this.dbService.update<Product>('products', updatedProduct)).pipe(
      tap(() => this.loadInitialData()), // Refresh list
      switchMap(() => of(updatedProduct))
    );
  }

  deleteProduct(id: number): Observable<void> {
    this.syncService.addToQueue({ url: `${this.apiUrl}/${id}`, method: 'DELETE', payload: null });
    return from(this.dbService.delete('products', id)).pipe(map(() => undefined));
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
      tap(() => this.loadInitialData()) // Refresh list
    );
  }
}