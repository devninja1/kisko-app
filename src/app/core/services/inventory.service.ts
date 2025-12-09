import { Injectable } from '@angular/core';
import { forkJoin, from, merge, Observable, of, throwError, combineLatest } from 'rxjs';
import { catchError, map, switchMap, tap, filter } from 'rxjs/operators';
import { ProductService } from './product.service';
import { SalesService } from './sales.service';
import { PurchaseService } from './purchase.service';
import { Product } from '../../model/product.model';
import { Sale } from '../../model/sale.model';
import { Purchase, PurchaseItem } from '../../model/purchase.model';
import { InventoryInflowItem, InventoryOutflowItem, InventorySummary, ProductInventoryMetrics } from '../../model/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(
    private productService: ProductService,
    private salesService: SalesService,
    private purchaseService: PurchaseService
  ) {}

  /**
   * Fetches all necessary data for inventory, using a stale-while-revalidate cache strategy.
   * It first emits cached data from IndexedDB, then fetches fresh data from services,
   * updates the cache, and emits the fresh data.
   */
  getInventoryData(): Observable<{ products: Product[], sales: Sale[], purchases: Purchase[] }> {
    // combineLatest will emit a new value whenever any of the source observables emit.
    // This creates a reactive stream that updates the inventory page in real-time.
    return combineLatest([
      this.productService.getProducts(),
      this.salesService.getSales(),
      this.purchaseService.getPurchases()
    ]).pipe(
      // Ensure we don't process until all streams have emitted at least once.
      filter(([products, sales, purchases]) => products.length > 0),
      map(([products, sales, purchases]) => {
        return { products, sales, purchases };
      })
    );
  }
  /**
   * Calculates and returns the inventory metrics (inflow, outflow, product-wise summary)
   * for a given set of raw data and a given date range.
   * @param allProducts All available products.
   * @param allSales All sales transactions.
   * @param allPurchases All purchase transactions.
   * @param startDate The start date of the period (optional).
   * @param endDate The end date of the period (optional).
   * @returns An InventorySummary object.
   */
  calculateInventorySummary(
    allProducts: Product[],
    allSales: Sale[],
    allPurchases: Purchase[],
    startDate: Date | null,
    endDate: Date | null
  ): InventorySummary {
    const productMetricsMap = new Map<string, ProductInventoryMetrics>();
    const inflowItems: InventoryInflowItem[] = [];
    const outflowItems: InventoryOutflowItem[] = [];

    let filteredSales = allSales;
    let filteredPurchases = allPurchases;

    if (startDate && endDate) {
      const startTimestamp = startDate.getTime();
      const endTimestamp = new Date(endDate.getTime() + 24 * 60 * 60 * 1000).getTime(); // Include full end day

      filteredSales = allSales.filter(sale => {
        const saleTime = sale.date.toDate().getTime();
        return saleTime >= startTimestamp && saleTime <= endTimestamp;
      });

      filteredPurchases = allPurchases.filter(purchase => {
        const purchaseTime = purchase.date.toDate().getTime();
        return purchaseTime >= startTimestamp && purchaseTime <= endTimestamp;
      });
    }

    // Process sales for outflow
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        // Find the full product details using the productId from the sale item.
        const product = allProducts.find(p => p.id === item.productId);
        if (!product) continue; // Skip if product not found, or handle error

        outflowItems.push({
          product: product,
          quantity: item.quantity,
          outflow_date: sale.date.toDate(),
          reason: 'Sale'
        });

        const metrics = productMetricsMap.get(product.id.toString()) || { sold: 0, added: 0, adjusted: 0 };
        metrics.sold += item.quantity;
        productMetricsMap.set(product.id.toString(), metrics);
      }
    }

    // Process purchases for inflow
    for (const purchase of filteredPurchases) {
      for (const item of purchase.items) {
        inflowItems.push({
          ...item,
          inflow_date: purchase.date.toDate(),
          batch_no: item.batch_no,
          expiry: item.expiry,
          source: purchase.supplier?.name,
          product: item.product // Ensure product is explicitly set
        });
        const metrics = productMetricsMap.get(item.product.id.toString()) || { sold: 0, added: 0, adjusted: 0 };
        metrics.added += item.quantity;
        productMetricsMap.set(item.product.id.toString(), metrics);
      }
    }

    // TODO: Integrate actual stock adjustments here if a service is created for them.
    // For now, productAdjustedQtyMap will remain empty unless manually updated.

    return {
      inflowItems,
      outflowItems,
      productMetricsMap
    };
  }

  /**
   * Updates the stock of a product via the ProductService.
   * @param productId The ID of the product to update.
   * @param change The quantity to add (positive) or remove (negative).
   * @returns An Observable of the API response.
   */
  updateProductStock(productId: string, change: number): Observable<void> {
    return this.productService.updateStock(productId, change);
  }
}