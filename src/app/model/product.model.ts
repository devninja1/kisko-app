export interface Product {
  id: number;
  product_code: number; // Unique, auto-incremented code
  name: string;
  unit_price: number;
  cost_price: number;
  stock: number;
  category: string;
  description?: string;
  is_active?: boolean;
  date_added: Date;
  date_modified: Date;
  user_added: string;
  user_modified: string;
}
