import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { Purchase, PurchaseToSave } from '../../model/purchase.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private firestore: Firestore = inject(Firestore);
  private purchasesCollection = collection(this.firestore, 'purchases');

  constructor(
  ) {}

  getPurchases(): Observable<Purchase[]> {
    return collectionData(this.purchasesCollection, { idField: 'id' }) as Observable<Purchase[]>;
  }

  /**
   * Saves a new purchase to Firestore.
   * Firestore handles offline creation and syncs when the app is back online.
   * @param purchaseData The purchase object to save.
   */
  savePurchase(purchaseData: PurchaseToSave): Observable<string> {
    const purchaseWithTimestamp = {
      ...purchaseData,
      date: Timestamp.fromDate(new Date()), // Use Firestore Timestamp
    };
    const promise = addDoc(this.purchasesCollection, purchaseWithTimestamp).then(docRef => docRef.id);
    return from(promise);
  }
}