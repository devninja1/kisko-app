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
  private defaultCustomers: Customer[] = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '234-567-8901' },
    { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', phone: '345-678-9012' },
    { id: 4, name: 'Mary Johnson', email: 'mary.j@example.com', phone: '456-789-0123' },
  ];

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
    this.dbService.count('customers').subscribe(count => {
      if (count === 0) {
        // DB is empty, populate with default data first.
        this.dbService.bulkAdd<Customer>('customers', this.defaultCustomers).subscribe(() => {
          this.customers$.next(this.defaultCustomers);
          if (this.isOnline) this.syncWithApi();
        });
      } else {
        // DB has data, load it and then sync if online.
        this.dbService.getAll<Customer>('customers').subscribe(custs => {
          this.customers$.next(custs);
          if (this.isOnline) this.syncWithApi();
          });
      }
    });
  }

  private syncWithApi() {
    this.http.get<Customer[]>(this.apiUrl).subscribe((customers: Customer[]) => {
      this.dbService.clear('customers').subscribe(() => {
        this.dbService.bulkAdd<Customer>('customers', customers).subscribe(() => {
          this.dbService.getAll<Customer>('customers').subscribe(custs => this.customers$.next(custs));
        });
      });
    });
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