import { Customer } from './customer.model';
import { SalesItem } from './sales.model';
import { Timestamp } from '@angular/fire/firestore';

// This represents a sale object retrieved from Firestore
export interface Sale {
  id: string;
  customer: Customer | null;
  customerName: string;
  items: SalesItem[];
  grandTotal: number;
  date: Timestamp; // Use Firestore Timestamp
}

// This represents the data structure when saving a new sale
export interface SaleToSave {
  customer: Customer;
  customerName: string;
  items: SalesItem[];
  grandTotal: number;
  date: Date;
}