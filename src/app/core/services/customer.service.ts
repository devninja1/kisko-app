import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../../model/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customers: Customer[] = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '234-567-8901' },
    { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', phone: '345-678-9012' },
    { id: 4, name: 'Mary Johnson', email: 'mary.j@example.com', phone: '456-789-0123' },
  ];

  private customers$ = new BehaviorSubject<Customer[]>(this.customers);

  getCustomers(): Observable<Customer[]> {
    return this.customers$.asObservable();
  }

  addCustomer(customerData: Omit<Customer, 'id'>): void {
    const newId = Math.max(...this.customers.map(c => c.id), 0) + 1;
    const newCustomer: Customer = { id: newId, ...customerData };
    this.customers = [...this.customers, newCustomer];
    this.customers$.next(this.customers);
  }

  updateCustomer(updatedCustomer: Customer): void {
    const index = this.customers.findIndex(c => c.id === updatedCustomer.id);
    if (index > -1) {
      this.customers[index] = updatedCustomer;
      this.customers = [...this.customers];
      this.customers$.next(this.customers);
    }
  }

  deleteCustomer(id: number): void {
    this.customers = this.customers.filter(c => c.id !== id);
    this.customers$.next(this.customers);
  }
}