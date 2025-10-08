import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, switchMap, tap, BehaviorSubject, map } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Customer } from '../../model/customer.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:3000/api/customers';
  private isOnline = navigator.onLine;
  private customers$ = new BehaviorSubject<Customer[]>([]);

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private syncService: SyncService
  ) {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    this.loadInitialData();
  }

  private loadInitialData() {
    if (this.isOnline) {
      this.http.get<Customer[]>(this.apiUrl).subscribe((customers: Customer[]) => {
        this.dbService.clear('customers').subscribe(() => {
          this.dbService.bulkAdd<Customer>('customers', customers).subscribe(() => {
            this.dbService.getAll<Customer>('customers').subscribe(custs => this.customers$.next(custs));
          });
        });
      });
    } else {
      this.dbService.getAll<Customer>('customers').subscribe(custs => this.customers$.next(custs));
    }
  }

  getCustomers(): Observable<Customer[]> {
    return this.customers$.asObservable();
  }

  addCustomer(customerData: Omit<Customer, 'id'>): Observable<Customer> {
    const tempId = -Date.now();
    const tempCustomer: Customer = { ...customerData, id: tempId };

    return from(this.dbService.add<Customer>('customers', tempCustomer)).pipe(
      tap(() => {
        const currentCustomers = this.customers$.getValue();
        this.customers$.next([...currentCustomers, tempCustomer]);
        this.syncService.addToQueue({ url: this.apiUrl, method: 'POST', payload: { ...customerData, tempId } });
      }),
      map(() => tempCustomer)
    );
  }

  updateCustomer(updatedCustomer: Customer): Observable<Customer> {
    this.syncService.addToQueue({ url: `${this.apiUrl}/${updatedCustomer.id}`, method: 'PUT', payload: updatedCustomer });
    return from(this.dbService.update<Customer>('customers', updatedCustomer)).pipe(
      tap(() => this.loadInitialData()), // Refresh list
      switchMap(() => of(updatedCustomer))
    );
  }

  deleteCustomer(id: number): Observable<void> {
    this.syncService.addToQueue({ url: `${this.apiUrl}/${id}`, method: 'DELETE', payload: null });
    return from(this.dbService.delete('customers', id)).pipe(switchMap(() => of(undefined)));
  }
}