import { Product } from './product.model';
import { Supplier } from './supplier.model';
import { Timestamp } from '@angular/fire/firestore';

export interface Payment {
  id: string;
  date: Timestamp;
  amount: number;
}

export interface PurchaseItem {
  product: Product;
  quantity: number;
  cost_price: number;
  total: number;
  batch_no?: string;
  expiry?: Date;
}

export interface Purchase {
  id: string;
  supplier: Supplier | null;
  items: PurchaseItem[];
  grandTotal: number;
  date: Timestamp;
  subTotal: number;
  tax: number;
  amountPaid?: number;
  payments?: Payment[];
}

export interface PurchaseToSave {
  supplier: Supplier | null;
  items: PurchaseItem[];
  grandTotal: number;
  date: Date;
  subTotal: number;
  tax: number;
  amountPaid?: number;
  // payments will be added via updates, not on initial save
}