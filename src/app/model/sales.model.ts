import { Product } from "./product.model";

export interface SalesItem {
  product: Product;
  quantity: number;
  total: number;
}