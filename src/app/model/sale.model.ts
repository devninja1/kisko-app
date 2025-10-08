import { Customer } from './customer.model';
import { SalesItem } from './sales.model';

export interface Sale {
  id: number;
  customer: Customer | null;
  items: SalesItem[];
  grandTotal: number;
  date: Date;
}