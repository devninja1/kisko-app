import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Supplier } from '../../model/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private firestore: Firestore = inject(Firestore);
  private suppliersCollection = collection(this.firestore, 'suppliers');

  constructor() {}

  /**
   * Streams all suppliers from Firestore in real-time.
   */
  getSuppliers(): Observable<Supplier[]> {
    return collectionData(this.suppliersCollection, { idField: 'id' }) as Observable<Supplier[]>;
  }

  /**
   * Adds a new supplier to Firestore.
   * @param supplierData The supplier data to save.
   */
  addSupplier(supplierData: Omit<Supplier, 'id'>): Observable<string> {
    const promise = addDoc(this.suppliersCollection, supplierData).then(
      (docRef) => docRef.id
    );
    return from(promise);
  }

  /**
   * Updates an existing supplier in Firestore.
   */
  updateSupplier(supplier: Supplier): Observable<void> {
    const supplierDoc = doc(this.firestore, `suppliers/${supplier.id}`);
    const { id, ...data } = supplier; // Exclude id from the data to be updated
    return from(updateDoc(supplierDoc, data));
  }

  /**
   * Deletes a supplier from Firestore.
   */
  deleteSupplier(id: string): Observable<void> {
    const supplierDoc = doc(this.firestore, `suppliers/${id}`);
    return from(deleteDoc(supplierDoc));
  }
}