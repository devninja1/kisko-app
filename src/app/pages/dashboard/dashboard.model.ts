export interface Product {
  name: string;
  rate: number;
  stock: number;
}

export interface SalesItem {
  product: Product;
  quantity: number;
  total: number;
}