import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/main/dashboard';
import { SalesComponent } from './pages/sales/main/sales.component';
import { ProductComponent } from './pages/product/main/product.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { SalesHistoryComponent } from './pages/sales-history/sales-history.component';
import { SyncStatusComponent } from './pages/sync-status/sync-status.component';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'sales', component: SalesComponent },
  { path: 'products', component: ProductComponent },
  { path: 'customers', component: CustomerComponent },
  { path: 'saleshistory', component: SalesHistoryComponent },
  { path: 'sync-status', component: SyncStatusComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' } // Wildcard route for a 404 page
];