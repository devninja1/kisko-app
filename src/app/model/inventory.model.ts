import { Product } from './product.model';
import { PurchaseItem } from './purchase.model';

export interface InventoryInflowItem extends PurchaseItem {
  inflow_date: Date;
  batch_no?: string;
  expiry?: Date;
  source?: string;
  product: Product; // Ensure product is always present for display
}

export interface InventoryOutflowItem {
  product: Product;
  quantity: number;
  outflow_date: Date;
  reason: string; // e.g., 'Sale', 'Adjustment', 'Spoilage'
}

export interface ProductInventoryMetrics {
  sold: number;
  added: number;
  adjusted: number; // For manual adjustments
}

export interface InventorySummary {
  inflowItems: InventoryInflowItem[];
  outflowItems: InventoryOutflowItem[];
  productMetricsMap: Map<string, ProductInventoryMetrics>;
}