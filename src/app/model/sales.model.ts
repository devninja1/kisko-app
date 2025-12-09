import { Product } from "./product.model";

export interface SalesItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}