import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../model/product.model';
import { Sale } from '../../model/sale.model';
import { SalesItem } from '../../model/sales.model';
import { Purchase, PurchaseItem } from '../../model/purchase.model'; // Assuming this model exists
import { ProductService } from '../../core/services/product.service';
import { SalesService } from '../../core/services/sales.service';
import { PurchaseService } from '../../core/services/purchase.service'; // Assuming this service exists
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryInflowItem, InventoryOutflowItem, ProductInventoryMetrics } from '../../model/inventory.model';

// import { UpdateStockDialogComponent } from './update-stock-dialog/update-stock-dialog.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, AfterViewInit, OnDestroy {
  inflowColumns: string[] = ['name', 'inflow_date', 'quantity', 'batch_no', 'expiry', 'source'];
  outflowColumns: string[] = ['name', 'outflow_date', 'quantity', 'reason'];
  stockSummaryColumns: string[] = ['name', 'category', 'stock', 'status'];
  
  inflowDataSource: MatTableDataSource<InventoryInflowItem> = new MatTableDataSource<InventoryInflowItem>();
  outflowDataSource: MatTableDataSource<InventoryOutflowItem> = new MatTableDataSource<InventoryOutflowItem>();
  stockSummaryDataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>();
  lowStockThreshold = 10;

  private allSales: Sale[] = [];
  private allPurchases: Purchase[] = [];
  private allProducts: Product[] = [];

  // Map for period-specific calculations, now using the service's interface
  private productMetricsMap = new Map<number, ProductInventoryMetrics>();

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator; // This will now be for the outflow table
  @ViewChild('outflowSort') outflowSort!: MatSort;
  @ViewChild('inflowSort') inflowSort!: MatSort;
  @ViewChild('stockSummarySort') stockSummarySort!: MatSort;

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor(
    private productService: ProductService,
    private salesService: SalesService,
    private purchaseService: PurchaseService,
    private inventoryService: InventoryService, // Inject the new service
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInitialData();

    this.dateRange.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateMetrics();
    });
  }

  loadInitialData(): void {
    this.inventoryService.getInventoryData().pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ products, sales, purchases }) => {
        this.allProducts = products;
        this.allSales = sales;
        this.allPurchases = purchases;
        this.stockSummaryDataSource.data = this.allProducts;
        this.calculateMetrics(); // Re-calculate and render with the latest data (stale or fresh)
      },
      error: err => console.error('Error during data loading and caching:', err)
    });
  }

  calculateMetrics(): void {
    const { start, end } = this.dateRange.value;
    const summary = this.inventoryService.calculateInventorySummary(
      this.allProducts,
      this.allSales,
      this.allPurchases,
      start ?? null,
      end ?? null
    );
    this.inflowDataSource.data = summary.inflowItems;
    this.outflowDataSource.data = summary.outflowItems;
    this.productMetricsMap = summary.productMetricsMap;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.outflowDataSource.paginator = this.paginator;
    this.outflowDataSource.sort = this.outflowSort;
    this.inflowDataSource.sort = this.inflowSort;
    this.stockSummaryDataSource.sort = this.stockSummarySort;
  }

  clearDateFilter(): void {
    this.dateRange.reset();
  }

  applyFilter(event: Event): void {
    // This filter now applies to both tables. You might want separate search inputs.
    const filterValue = (event.target as HTMLInputElement).value;
    this.inflowDataSource.filter = filterValue.trim().toLowerCase();
    this.stockSummaryDataSource.filter = filterValue.trim().toLowerCase();
    this.outflowDataSource.filter = filterValue.trim().toLowerCase();

    if (this.outflowDataSource.paginator) {
      this.outflowDataSource.paginator.firstPage();
    }
  }

  getOpeningStock(product: Product): number {
    const metrics = this.productMetricsMap.get(product.id);
    if (!metrics) return product.stock; // If no metrics for product, assume current stock is opening

    const qtyAdded = metrics.added;
    const qtySold = metrics.sold;
    const qtyAdjusted = metrics.adjusted;
    // Opening Stock = Closing Stock - Added + Sold + Adjusted(Lost)
    return product.stock - qtyAdded + qtySold + qtyAdjusted;
  }

  getQuantityAdded(product: Product): number {
    return this.productMetricsMap.get(product.id)?.added || 0;
  }

  getQuantitySold(product: Product): number {
    return this.productMetricsMap.get(product.id)?.sold || 0;
  }

  getQuantityAdjusted(product: Product): number {
    // This is a placeholder. For accurate tracking, stock adjustments
    // should be saved and fetched like sales/purchases.
    return this.productMetricsMap.get(product.id)?.adjusted ?? 0;
  } // This method is still needed for display, but its value comes from the map

  getStockStatus(product: Product): string {
    if (product.stock < 0) {
      return 'Lost Inventory';
    } else if (product.stock === 0) {
      return 'Out of Stock';
    } else if (product.stock < this.lowStockThreshold) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  getStockStatusClass(product: Product): string {
    if (product.stock < 0) {
      return 'status-lost';
    } else if (product.stock === 0) {
      return 'status-out-of-stock';
    } else if (product.stock < this.lowStockThreshold) {
      return 'status-low-stock';
    } else {
      return 'status-in-stock';
    }
  }

  updateStock(product: Product): void {
    // This is a placeholder for opening a dialog to update stock.
    // You would need to create a dialog component for this.
    /*
    const dialogRef = this.dialog.open(UpdateStockDialogComponent, {
      width: '300px',
      data: { product: product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Call a service method to update the stock
        this.productService.updateStock(product.id, result.change).subscribe(() => {
          this.loadInventory();
        });
      }
    });
    */
   console.log('Update stock for:', product.name);
   // For now, let's just log it. You can implement the dialog later.
   const amount = prompt(`Enter stock change for ${product.name} (current: ${product.stock})`, '0');
   if (amount !== null) {
     const change = parseInt(amount, 10);
     if (!isNaN(change)) {
       this.inventoryService.updateProductStock(product.id, change)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Instead of reloading everything, just update the specific product in the datasource
            const productInSummary = this.allProducts.find(p => p.id === product.id);
            if (productInSummary) productInSummary.stock += change;
            product.stock += change;
            // To make "Lost/Adjusted" column work, we'd update its map here
            if (!this.dateRange.value.start && !this.dateRange.value.end) {
                const metrics = this.productMetricsMap.get(product.id) || { sold: 0, added: 0, adjusted: 0 };
                metrics.adjusted -= change;
                this.calculateMetrics(); // Recalculate to update tables
            }
          },
          error: (err: any) => console.error('Error updating stock:', err) // Handle error, maybe revert optimistic update
        });
     }
   }
  }
}