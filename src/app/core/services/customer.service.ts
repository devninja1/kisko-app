import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Customer, CustomerToSave } from '../../model/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private firestore: Firestore = inject(Firestore);
  private customersCollection = collection(this.firestore, 'customers');

  constructor() {}

  /**
   * Streams all customers from Firestore in real-time.
   */
  getCustomers(): Observable<Customer[]> {
    return collectionData(this.customersCollection, { idField: 'id' }) as Observable<Customer[]>;
  }

  /**
   * Adds a new customer to Firestore and returns the newly created customer object.
   * @param customerData The customer data to save.
   */
  addCustomer(customerData: CustomerToSave): Observable<Customer> {
    const promise = addDoc(this.customersCollection, customerData).then(docRef => {
      return {
        id: docRef.id,
        ...customerData,
      } as Customer;
    });
    return from(promise);
  }

  /**
   * Updates an existing customer in Firestore.
   */
  updateCustomer(customer: Customer): Observable<void> {
    const customerDoc = doc(this.firestore, `customers/${customer.id}`);
    // Destructure to avoid sending the id field inside the document data
    const { id, ...data } = customer;
    return from(updateDoc(customerDoc, data));
  }

  /**
   * Deletes a customer from Firestore.
   */
  deleteCustomer(id: string): Observable<void> {
    const customerDoc = doc(this.firestore, `customers/${id}`);
    return from(deleteDoc(customerDoc));
  }
}