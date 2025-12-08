import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  arrayRemove,
} from '@angular/fire/firestore';
import { Payment, Purchase, PurchaseToSave } from '../../model/purchase.model';

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

  updatePurchase(id: string, data: Partial<Purchase>): Observable<void> {
    const purchaseDocRef = doc(this.firestore, `purchases/${id}`);
    return from(updateDoc(purchaseDocRef, data));
  }

  addPayment(purchaseId: string, paymentAmount: number): Observable<void> {
    const purchaseDocRef = doc(this.firestore, `purchases/${purchaseId}`);
    const newPayment = {
      id: Date.now().toString(), // Simple unique ID
      date: Timestamp.now(),
      amount: paymentAmount,
    };
    // Atomically update the payments array and increment the total amount paid.
    const promise = updateDoc(purchaseDocRef, { payments: arrayUnion(newPayment), amountPaid: increment(paymentAmount) });
    return from(promise);
  }

  deletePayment(purchaseId: string, payment: Payment): Observable<void> {
    const purchaseDocRef = doc(this.firestore, `purchases/${purchaseId}`);
    // Atomically remove the payment and decrement the total amount paid.
    const promise = updateDoc(purchaseDocRef, { payments: arrayRemove(payment), amountPaid: increment(-payment.amount) });
    return from(promise);
  }

  updatePayment(purchaseId: string, oldPayment: Payment, newAmount: number): Observable<void> {
    const purchaseDocRef = doc(this.firestore, `purchases/${purchaseId}`);
    const newPayment = { ...oldPayment, amount: newAmount };
    const amountDifference = newAmount - oldPayment.amount;

    // Atomically replace the payment object and update the total amount paid.
    const promise = updateDoc(purchaseDocRef, { payments: arrayRemove(oldPayment), amountPaid: increment(amountDifference) }).then(() => updateDoc(purchaseDocRef, { payments: arrayUnion(newPayment) }));
    return from(promise);
  }
}