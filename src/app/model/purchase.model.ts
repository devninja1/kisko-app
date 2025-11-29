import { Product } from './product.model';
import { Supplier } from './supplier.model';
import { Timestamp } from '@angular/fire/firestore';

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
}

export interface PurchaseToSave {
  supplier: Supplier | null;
  items: PurchaseItem[];
  grandTotal: number;
  date: Date;
}