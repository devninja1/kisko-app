import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, tap, BehaviorSubject, switchMap, forkJoin } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Sale } from '../../model/sale.model';
import { SyncService } from './sync.service';
import { ProductService } from './product.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = `${environment.apiUrl}/sales`;
  private isOnline = navigator.onLine;
  private sales$ = new BehaviorSubject<Sale[]>([]);

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService,
    private productService: ProductService // Inject ProductService
  ) {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.dbService.getAll<Sale>('sales').pipe(
      tap(sales => this.sales$.next(sales)),
      switchMap(() => {
        if (this.isOnline) {
          return this.syncWithApi();
        }
        return of(null);
      })
    ).subscribe();
  }

  private syncWithApi(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl).pipe(
      switchMap(sales => this.dbService.clear('sales').pipe(
        switchMap(() => this.dbService.bulkAdd<Sale>('sales', sales)),
        switchMap(() => this.dbService.getAll<Sale>('sales'))
      )),
      tap(sales => this.sales$.next(sales))
    );
  }

  getSales(): Observable<Sale[]> {
    return this.sales$.asObservable();
  }

  saveSale(saleData: Omit<Sale, 'id'>): Observable<Sale> {
    const tempId = -Date.now();
    const tempSale: Sale = { ...saleData, id: tempId };

    // Create an array of stock update observables
    const stockUpdateObservables = saleData.items.map(item =>
      this.productService.updateStock(item.product.id, -item.quantity) // Decrease stock
    );

    return from(this.dbService.add<Sale>('sales', tempSale)).pipe(
      tap(() => {
        const currentSales = this.sales$.getValue();
        this.sales$.next([...currentSales, tempSale]);
        this.syncService.addToQueue({
          url: this.apiUrl,
          method: 'POST',
          payload: { ...saleData, tempId }
        });
      }),
      // Execute all stock updates
      switchMap(() => forkJoin(stockUpdateObservables).pipe(switchMap(() => of(tempSale))))
    );
  }
}