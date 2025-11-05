import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Purchase } from '../../model/purchase.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = 'http://localhost:3000/api/purchases';

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService
  ) {}

  getPurchases(): Observable<Purchase[]> {
    return this.dbService.getAll<Purchase>('purchases');
  }

  savePurchase(purchaseData: Omit<Purchase, 'id'>): Observable<Purchase> {
    const tempId = -Date.now();
    const purchaseToSave: Purchase = {
      ...purchaseData,
      id: tempId,
    };

    return from(this.dbService.add<Purchase>('purchases', purchaseToSave)).pipe(
      tap(() => {
        this.syncService.addToQueue({
          url: this.apiUrl, method: 'POST', payload: { ...purchaseData, tempId }
        });
      }),
      map(() => purchaseToSave)
    );
  }
}