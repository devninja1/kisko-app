import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard/dashboard';
import { SalesComponent } from './pages/sales/main/sales.component';
import { ProductComponent } from './pages/product/main/product.component';
import { CustomerComponent } from './pages/customer/customer.component';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'sales', component: SalesComponent },
  { path: 'products', component: ProductComponent },
  { path: 'customers', component: CustomerComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' } // Wildcard route for a 404 page
];