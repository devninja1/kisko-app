export interface Product {
  id: number;
  product_code: number;
  name: string;
  category: string;
  description: string;
  unit_price: number;
  cost_price: number;
  stock: number;
  is_Stock_enable: boolean;
  is_active: boolean;
}
