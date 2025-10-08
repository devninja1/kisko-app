import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, tap } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Sale } from '../../model/sale.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = 'http://localhost:3000/api/sales';
  private isOnline = navigator.onLine;

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService
  ) {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  getSales(): Observable<Sale[]> {
    if (this.isOnline) {
      this.http.get<Sale[]>(this.apiUrl).subscribe((sales: Sale[]) => {
        this.dbService.clear('sales').subscribe(() => {
          this.dbService.bulkAdd<Sale>('sales', sales).subscribe();
        });
      });
    }
    return this.dbService.getAll<Sale>('sales');
  }

  saveSale(saleData: Omit<Sale, 'id'>): Observable<Sale> {
    if (this.isOnline) {
      return this.http.post<Sale>(this.apiUrl, saleData).pipe(
        tap(newSale => this.dbService.add<Sale>('sales', newSale).subscribe())
      );
    } else {
      this.syncService.addToQueue({ url: this.apiUrl, method: 'POST', payload: saleData });
      const offlineSale = { ...saleData, id: -1 }; // Temporary ID
      return from(this.dbService.add<Sale>('sales', offlineSale)).pipe(
        tap(() => of(offlineSale))
      );
    }
  }
}