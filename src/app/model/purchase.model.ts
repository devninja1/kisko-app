import { Product } from './product.model';
import { Supplier } from './supplier.model';

export interface PurchaseItem {
  product: Product;
  quantity: number;
  total: number;
  batch_no?: string;
  expiry?: Date;
}

export interface Purchase {
  id?: number;
  items: PurchaseItem[];
  grandTotal: number;
  date: Date;
  supplierId?: number | null;
  supplier?: Supplier | null;
}