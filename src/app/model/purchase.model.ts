import { Product } from './product.model';

export interface PurchaseItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Purchase {
  id?: number;
  items: PurchaseItem[];
  grandTotal: number;
  date: Date;
  supplierId?: number | null;
}