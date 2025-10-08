import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, tap, BehaviorSubject } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Sale } from '../../model/sale.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = 'http://localhost:3000/api/sales';
  private isOnline = navigator.onLine;
  private sales$ = new BehaviorSubject<Sale[]>([]);

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService
  ) {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    this.loadInitialData();
  }

  private loadInitialData(): void {
    if (this.isOnline) {
      this.syncWithApi();
    } else {
      this.dbService.getAll<Sale>('sales').subscribe(sales => this.sales$.next(sales));
    }
  }

  private syncWithApi(): void {
    this.http.get<Sale[]>(this.apiUrl).subscribe((sales: Sale[]) => {
      this.dbService.clear('sales').subscribe(() => {
        this.dbService.bulkAdd<Sale>('sales', sales).subscribe(() => {
          this.dbService.getAll<Sale>('sales').subscribe(s => this.sales$.next(s));
        });
      });
    });
  }

  getSales(): Observable<Sale[]> {
    return this.sales$.asObservable();
  }

  saveSale(saleData: Omit<Sale, 'id'>): Observable<Sale> {
    const tempId = -Date.now();
    const tempSale: Sale = { ...saleData, id: tempId };

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
      tap(() => of(tempSale))
    );
  }
}