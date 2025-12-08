import { Injectable, inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  Timestamp,
  doc,
  docData,
  runTransaction,
  deleteDoc,
  increment,
} from '@angular/fire/firestore';
import { Sale, SaleToSave } from '../../model/sale.model';
import { Payment } from '../../model/purchase.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private firestore: Firestore = inject(Firestore);
  private salesCollection = collection(this.firestore, 'sales');

  /**
   * Streams all sales from Firestore in real-time.
   * Automatically handles offline caching and synchronization.
   */
  getSales(): Observable<Sale[]> {
    return collectionData(this.salesCollection, { idField: 'id' }) as Observable<Sale[]>;
  }

  /**
   * Gets a single sale document by its ID.
   * @param saleId The ID of the sale document.
   */
  getSaleById(saleId: string): Observable<Sale | undefined> {
    const saleDocRef = doc(this.firestore, `sales/${saleId}`);
    // The 'idField' option ensures the document ID is included in the emitted object.
    return docData(saleDocRef, { idField: 'id' }) as Observable<Sale | undefined>;
  }

  /**
   * Saves a new sale to Firestore.
   * Firestore handles offline creation and syncs when the app is back online.
   * @param saleData The sale object to save.
   */
  saveSale(saleData: SaleToSave): Observable<string> {
    const counterRef = doc(this.firestore, 'counters', 'salesCounter');
    const newSaleRef = doc(this.salesCollection); // Create a new doc ref with an auto-generated ID

    const promise = runTransaction(this.firestore, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let newInvoiceId = 1;
      if (counterDoc.exists()) {
        newInvoiceId = counterDoc.data()['current'] + 1;
      }

      const saleWithTimestampAndId = {
        ...saleData,
        invoiceId: newInvoiceId,
        date: Timestamp.fromDate(new Date()),
      };

      transaction.set(newSaleRef, saleWithTimestampAndId);
      transaction.set(counterRef, { current: newInvoiceId }, { merge: !counterDoc.exists() });

      return newSaleRef.id;
    });
    return from(promise);
  }

  /**
   * Deletes a sale from Firestore.
   * @param saleId The ID of the sale document to delete.
   */
  deleteSale(saleId: string): Observable<void> {
    const saleDocRef = doc(this.firestore, `sales/${saleId}`);
    return from(deleteDoc(saleDocRef));
  }

  /**
   * Adds a new payment to a sale and updates the total amount paid.
   * Uses a transaction to ensure atomicity.
   * @param saleId The ID of the sale to update.
   * @param amount The payment amount.
   */
  addPayment(saleId: string, amount: number): Observable<void> {
    const saleDocRef = doc(this.firestore, `sales/${saleId}`);
    const promise = runTransaction(this.firestore, async (transaction) => {
      const saleDoc = await transaction.get(saleDocRef);
      if (!saleDoc.exists()) {
        throw new Error('Sale document does not exist!');
      }

      const saleData = saleDoc.data() as Sale;
      const currentAmountPaid = saleData.amountPaid ?? 0;
      const currentPayments = saleData.payments ?? [];

      const newPayment: Payment = {
        id: crypto.randomUUID(), // Generate a unique ID for the new payment
        amount,
        date: Timestamp.now(),
      };

      transaction.update(saleDocRef, {
        payments: [...currentPayments, newPayment],
        amountPaid: currentAmountPaid + amount,
      });
    });
    return from(promise);
  }

  /**
   * Updates an existing payment for a sale.
   * Uses a transaction to ensure atomicity.
   * @param saleId The ID of the sale.
   * @param oldPayment The original payment object to be replaced.
   * @param newAmount The new payment amount.
   */
  updatePayment(saleId: string, oldPayment: Payment, newAmount: number): Observable<void> {
    const saleDocRef = doc(this.firestore, `sales/${saleId}`);
    const promise = runTransaction(this.firestore, async (transaction) => {
      const saleDoc = await transaction.get(saleDocRef);
      if (!saleDoc.exists()) {
        throw new Error('Sale document does not exist!');
      }

      const saleData = saleDoc.data() as Sale;
      const payments = saleData.payments ?? [];
      const amountPaid = saleData.amountPaid ?? 0;

      const paymentIndex = payments.findIndex(p => p.id === oldPayment.id);
      if (paymentIndex === -1) {
        throw new Error('Payment to update not found.');
      }

      const updatedPayments = [...payments];
      updatedPayments[paymentIndex] = { ...payments[paymentIndex], amount: newAmount };

      const amountDifference = newAmount - oldPayment.amount;

      transaction.update(saleDocRef, {
        payments: updatedPayments,
        amountPaid: amountPaid + amountDifference,
      });
    });
    return from(promise);
  }

  /**
   * Deletes a payment from a sale.
   * Uses a transaction to ensure atomicity.
   * @param saleId The ID of the sale.
   * @param paymentToDelete The payment object to delete.
   */
  deletePayment(saleId: string, paymentToDelete: Payment): Observable<void> {
    const saleDocRef = doc(this.firestore, `sales/${saleId}`);
    const promise = runTransaction(this.firestore, async (transaction) => {
      const saleDoc = await transaction.get(saleDocRef);
      if (!saleDoc.exists()) { throw new Error('Sale document does not exist!'); }
      const { payments = [], amountPaid = 0 } = saleDoc.data() as Sale;
      const updatedPayments = payments.filter(p => p.id !== paymentToDelete.id);
      transaction.update(saleDocRef, { payments: updatedPayments, amountPaid: amountPaid - paymentToDelete.amount });
    });
    return from(promise);
  }
}