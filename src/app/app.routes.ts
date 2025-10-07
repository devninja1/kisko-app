import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard/dashboard';
import { SalesComponent } from './pages/sales/main/sales.component';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'sales', component: SalesComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' } // Wildcard route for a 404 page
];