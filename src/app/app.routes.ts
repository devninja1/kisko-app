import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/main/dashboard';
import { SalesComponent } from './pages/sales/main/sales.component';
import { ProductComponent } from './pages/product/main/product.component';
import { SalesHistoryComponent } from './pages/sales-history/sales-history.component'; import { SupplierManagementComponent } from './pages/supplier/supplier-management.component'; import { PurchaseHistoryComponent } from './pages/purchases/history/purchase-history.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { authGuard } from './core/services/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { SaleReceiptPageComponent } from './pages/sales/print/sale-receipt-page.component';



export const routes: Routes = [
  { path: 'printSale',  component: SaleReceiptPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', component: Dashboard, canActivate: [authGuard], },
  { path: 'suppliers', canActivate: [authGuard], component: SupplierManagementComponent },
  { path: 'purchase-history', canActivate: [authGuard], component: PurchaseHistoryComponent },
  { path: 'purchases', canActivate: [authGuard], component: PurchasesComponent },
  { path: 'products', canActivate: [authGuard], component: ProductComponent },
  { path: 'inventory', canActivate: [authGuard], component: InventoryComponent },
  { path: 'customers', canActivate: [authGuard], component: CustomerComponent }, // Assuming you have this component
  { path: 'saleshistory', canActivate: [authGuard], component: SalesHistoryComponent },
  { path: 'sales', canActivate: [authGuard], component: SalesComponent },
  
  
  { path: '**', redirectTo: '' } // Wildcard route
];