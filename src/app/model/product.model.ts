export interface Product {
  id: number;
  name: string;
  unit_price: number;
  cost_price: number;
  stock: number;
  category: string;
  description?: string;
  is_active?: boolean;
}