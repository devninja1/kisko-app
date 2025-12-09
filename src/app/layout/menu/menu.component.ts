import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive, MatTooltipModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  @Input() collapsed = false;
  @Output() menuItemClicked = new EventEmitter<void>();
  private authService = inject(AuthService);
  readonly user$ = this.authService.user$;
  private router = inject(Router);

  menuItems = [
    { name: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { name: 'Sales', icon: 'point_of_sale', route: '/sales' },
    { name: 'Sales History', icon: 'history', route: '/saleshistory' },
    { name: 'Products', icon: 'inventory_2', route: '/products' },
    { name: 'Inventory', icon: 'inventory', route: '/inventory' },
    { name: 'Suppliers', icon: 'local_shipping', route: '/suppliers' },
    { name: 'Purchases', icon: 'shopping_cart', route: '/purchases' },
    { name: 'Purchase History', icon: 'receipt_long', route: '/purchase-history' },  
    { name: 'Customers', icon: 'people', route: '/customers' }, 
    { name: 'Settings', icon: 'settings', route: '/settings' },
  ];

  onItemClick(): void {
    this.menuItemClicked.emit();
  }

  async logout(): Promise<void> {
    // Implement your logout logic here
    console.log('Logout clicked!');
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally, show a snackbar message on failure
    }
  }

}