import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterLink, RouterLinkActive, MatTooltipModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  @Input() collapsed = false;
  @Output() menuItemClicked = new EventEmitter<void>();

  menuItems = [
    { name: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { name: 'Sales', icon: 'point_of_sale', route: '/sales' },
    { name: 'Products', icon: 'inventory_2', route: '/products' },
    { name: 'Customers', icon: 'people', route: '/customers' },
    { name: 'Settings', icon: 'settings', route: '/settings' },
  ];

  onItemClick(): void {
    this.menuItemClicked.emit();
  }

  logout(): void {
    // Implement your logout logic here
    console.log('Logout clicked!');
  }
}