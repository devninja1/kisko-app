import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { Sale, SaleToSave } from '../../model/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private firestore: Firestore = inject(Firestore);
  private salesCollection = collection(this.firestore, 'sales');

  constructor() {}

  /**
   * Streams all sales from Firestore in real-time.
   * Automatically handles offline caching and synchronization.
   */
  getSales(): Observable<Sale[]> {
    return collectionData(this.salesCollection, { idField: 'id' }) as Observable<Sale[]>;
  }

  /**
   * Saves a new sale to Firestore.
   * Firestore handles offline creation and syncs when the app is back online.
   * @param saleData The sale object to save.
   */
  saveSale(saleData: SaleToSave): Observable<string> {
    const saleWithTimestamp = {
      ...saleData,
      date: Timestamp.fromDate(new Date()), // Use Firestore Timestamp for better querying
    };
    const promise = addDoc(this.salesCollection, saleWithTimestamp).then((docRef) => docRef.id);
    return from(promise);
  }
}