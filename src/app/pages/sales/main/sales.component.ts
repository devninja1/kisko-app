import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Child Components
import { SalesEntryComponent } from '../entry/sales-entry.component';
import { SalesListComponent } from '../list/sales-list.component';

// Models and Services
import { Product } from '../../../model/product.model';
import { SalesItem } from '../../../model/sales.model';
import { Customer } from '../../../model/customer.model';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { CustomerFormComponent } from '../../customer/form/customer-form.component';
import { CustomerService } from '../../../core/services/customer.service';
import { SalesService } from '../../../core/services/sales.service';

// Main Component
@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    SalesEntryComponent,
    SalesListComponent,
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  products$: Observable<Product[]>;
  customers: Customer[] = [];
  salesList: SalesItem[] = [];
  addedProductNames = new Set<string>();

  customerSearch = new FormControl<string | Customer>('');
  filteredCustomers$!: Observable<Customer[]>;
  selectedCustomer: Customer | null = null;

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private salesService: SalesService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.products$ = this.productService.getProducts().pipe(
      map(products => products.filter(p => p.is_active))
    );
  }

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe(customers => {
      this.customers = customers;
      this.filteredCustomers$ = this.customerSearch.valueChanges.pipe(
        startWith(''),
        map(value => (typeof value === 'string' ? value : value?.name ?? '')),
        map(name => (name ? this._filterCustomers(name) : this.customers.slice())),
      );
    });
  }

  onItemAdded(newItem: SalesItem) {
    // Decrease stock from the master product list
    this.productService.updateStock(newItem.productId.toString(), -newItem.quantity).subscribe();
    const existingItemIndex = this.salesList.findIndex(
      (saleItem) => saleItem.productId === newItem.productId
    );

    if(existingItemIndex > -1) {
      // Product already exists, so we update it
      const updatedSalesList = [...this.salesList];
      const existingItem = updatedSalesList[existingItemIndex];

      // Update quantity, rate, and total
      existingItem.quantity += newItem.quantity;
      existingItem.unitPrice = newItem.unitPrice; // Use the latest rate
      existingItem.total = existingItem.unitPrice * existingItem.quantity;

      this.salesList = updatedSalesList;
    } else {
      // Product is new, add it to the list
      this.salesList = [...this.salesList, newItem];
      this.addedProductNames.add(newItem.productName);
    }
  }

  private _filterCustomers(name: string): Customer[] {
    const filterValue = name.toLowerCase();
    return this.customers.filter(customer => customer.name.toLowerCase().includes(filterValue));
  }

  displayCustomer(customer: Customer): string {
    return customer && customer.name ? customer.name : '';
  }

  onCustomerSelected(event: any) {
    this.selectedCustomer = event.option.value;
  }

  createNewCustomer(customerName: string): void {
    const dialogRef: MatDialogRef<CustomerFormComponent, Omit<Customer, 'id'>> = this.dialog.open(CustomerFormComponent, {
      width: '400px',
      // Pre-fill the form with the name the user typed
      data: { customer: { name: customerName, email: '', phone: '' } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // result is the form value: Omit<Customer, 'id'>
        this.customerService.addCustomer(result).subscribe(newCustomer => {
          this.customerSearch.setValue(newCustomer);
          this.selectedCustomer = newCustomer;
        });
      }
    });
  }

  onItemDeleted(index: number) {
    const deletedItem = this.salesList[index];
    if (deletedItem) {
      this.productService.updateStock(deletedItem.productId.toString(), deletedItem.quantity).subscribe();

      this.addedProductNames.delete(deletedItem.productName);
      // Create a new array to ensure change detection is triggered
      this.salesList = this.salesList.filter((_, i: number) => i !== index);
    }
  }

  get grandTotal(): number {
    return this.salesList.reduce((acc, item) => acc + item.total, 0);
  }

  saveSale(): void {
    if (this.salesList.length === 0) {
      return; // Don't save an empty sale
    }

    if (!this.selectedCustomer) {
      this.snackBar.open('Please select a customer before saving the sale.', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['warn-snackbar'] // Optional: for custom styling
      });
      return;
    }

    this.salesService
      .saveSale({
        customer: this.selectedCustomer,
        customerName: this.selectedCustomer.name,
        items: this.salesList,
        grandTotal: this.grandTotal,
        date: new Date(),
      })
      .subscribe(() => {
        this.snackBar.open('Sale saved successfully!', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
        });

        // Reset the page for the next sale
        this.salesList = [];
        this.addedProductNames.clear();
        this.selectedCustomer = null;
        this.customerSearch.setValue('');
      });
  }
}