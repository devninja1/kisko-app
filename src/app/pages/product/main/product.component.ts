import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; 
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../model/product.model';
import { ProductFormComponent } from '../form/product-form.component';
import { ProductService } from '../../../core/services/product.service';
import { ExportService } from '../../../core/services/export.service'; // Import the new service
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { first, forkJoin, of, Observable } from 'rxjs';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'category', 'description', 'cost_price', 'unit_price', 'profit_margin', 'stock', 'is_active', 'actions'];
  dataSource: MatTableDataSource<Product>;
  products: Product[] = [];

  categoryFilter = new FormControl('');
  isImporting = false; // For loading indicator
  uniqueCategories: string[] = [];
  private filterValues = { global: '', category: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialog: MatDialog, 
    private productService: ProductService, 
    private exportService: ExportService,
    private snackBar: MatSnackBar
    ) {
    this.dataSource = new MatTableDataSource<Product>([]);
    
  }

  ngOnInit(): void {
    this.categoryFilter.valueChanges.subscribe(value => {
      this.filterValues.category = value || '';
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });

    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: Product, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      // Combine all searchable string properties of the product
      const dataStr = [data.name, data.description, data.category, data.cost_price, data.unit_price, data.stock]
        .filter(Boolean) // Filter out null/undefined values
        .join(' ')
        .toLowerCase();

      const globalMatch = dataStr.includes(searchTerms.global.trim().toLowerCase());
      const categoryMatch = searchTerms.category ? data.category.toLowerCase() === searchTerms.category.toLowerCase() : true;

      return globalMatch && categoryMatch;
    };
    // Custom sorting for calculated 'profit_margin' column
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'profit_margin':
          if (item.unit_price === 0) return 0;
          return (item.unit_price - item.cost_price) / item.unit_price;
        default:
          return (item as any)[property];
      }
    };

    // The getProducts() returns a BehaviorSubject, so we can subscribe to it.
    // The table will update automatically whenever the service emits new data.
    this.productService.getProducts().subscribe(products => {
      this.dataSource.data = products;
      this.uniqueCategories = [...new Set(products.map(p => p.category))].sort();
      // Re-apply the filter in case the data changed
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
  }

  loadProducts(): void {
    this.productService.getProducts().pipe(first()).subscribe(data => {
      this.products = data;
    });
  }

  applyFilter(event: Event) {
    this.filterValues.global = (event.target as HTMLInputElement).value;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  openProductForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '400px',
      data: { product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (product) {
          this.productService.updateProduct({ ...product, ...result }).subscribe();
        } else {
          this.productService.addProduct(result).subscribe();
        }
      }
    });
  }

  deleteProduct(id: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: 'Are you sure you want to delete this product?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(id).subscribe();
      }
    });
  }

   exportAllProducts(): void {
    // Define the headers and their order for the CSV file
    const headers: (keyof Product)[] = [
      'id',
      'name',
      'category',
      'description',
      'cost_price',
      'unit_price',
      'stock',
      'is_active'
    ];
    this.exportService.downloadCsv(this.products, 'all-products', headers);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'text/csv') {
        this.snackBar.open('Please select a valid CSV file.', 'Close', { duration: 3000 });
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          this.processImportedData(result.data as any[]);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          this.snackBar.open('Error parsing CSV file. Please check the file format.', 'Close', { duration: 5000 });
        }
      });
    }
    // Reset the input value to allow selecting the same file again
    if (input) {
      input.value = '';
    }
  }

  private processImportedData(csvData: any[]): void {
    this.isImporting = true;
    const currentProducts = this.dataSource.data;
    const updates: Observable<any>[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    csvData.forEach(csvProduct => {
      if (!csvProduct.name) return; // Skip rows without a product name
      // Normalize CSV data: convert types
      const importedProduct = {
        ...csvProduct,
        cost_price: parseFloat(csvProduct.cost_price) || 0,
        unit_price: parseFloat(csvProduct.unit_price) || 0,
        stock: parseInt(csvProduct.stock, 10) || 0,
        // Handle boolean conversion for various string values ('true', '1', 'yes')
        is_active: ['true', '1', 'yes'].includes(String(csvProduct.is_active).toLowerCase()),
      };

      // Use 'id' for matching if it exists, otherwise fall back to 'name'
      const existingProduct = currentProducts.find(p => 
        (importedProduct.id && p.id === importedProduct.id) || 
        (!importedProduct.id && p.name.toLowerCase() === importedProduct.name.toLowerCase())
      );

      if (existingProduct) {
        // This is an update
        updates.push(this.productService.updateProduct({ ...existingProduct, ...importedProduct }));
        updatedCount++;
      } else {
        // This is a new product
        // Remove 'id' if it's empty, letting the backend generate it
        if (!importedProduct.id) {
          delete importedProduct.id;
        }
        updates.push(this.productService.addProduct(importedProduct));
        addedCount++;
      }
    });

    if (updates.length > 0) {
      forkJoin(updates).subscribe({
        next: () => {
          this.snackBar.open(`Import successful: ${addedCount} products added, ${updatedCount} products updated.`, 'Close', { duration: 5000 });
          this.isImporting = false;
        },
        error: (err) => {
          this.snackBar.open('An error occurred during the import process.', 'Close', { duration: 5000 });
          this.isImporting = false;
        }
      });
    } else {
      this.isImporting = false;
    }
  }
}