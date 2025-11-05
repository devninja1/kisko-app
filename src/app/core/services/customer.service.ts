import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, switchMap, tap, BehaviorSubject, map, catchError, EMPTY, throwError } from 'rxjs';
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
    this.dbService.count('customers').pipe(
      switchMap(count => {
        if (count === 0) {
          console.log('No customers in DB, adding default customers.');
          return this.dbService.bulkAdd<Customer>('customers', this.defaultCustomers).pipe(
            tap(() => this.customers$.next(this.defaultCustomers))
          );
        } else {
          console.log('Loading customers from DB.');
          return this.dbService.getAll<Customer>('customers').pipe(
            tap(customers => this.customers$.next(customers))
          );
        }
      }),
      tap(() => {
        if (this.isOnline) {
          this.syncWithApi().subscribe();
        }
      }),
      catchError(err => {
        console.error('Error loading initial customer data', err);
        return EMPTY;
      })
    ).subscribe();
  }

  private syncWithApi(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      switchMap(apiCustomers => {
        return this.dbService.clear('customers').pipe(
          switchMap(() => this.dbService.bulkAdd<Customer>('customers', apiCustomers)),
          switchMap(() => this.dbService.getAll<Customer>('customers'))
        );
      }),
      tap(syncedCustomers => {
        this.customers$.next(syncedCustomers);
      }),
      catchError(err => {
        console.error('API sync failed for customers', err);
        return throwError(() => new Error('Failed to sync customers from API.'));
      })
    );
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
      map(() => tempCustomer),
      catchError(err => {
        console.error('Failed to add customer to IndexedDB', err);
        return throwError(() => new Error('Failed to add customer locally.'));
      })
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