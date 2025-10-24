import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { MenuComponent } from '../menu/menu.component';
import { LoadingService } from '../../core/services/loading.service';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MenuComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  currentYear = new Date().getFullYear();
  showSyncButton$: Observable<boolean>;
  pendingRequestCount$: Observable<number>;

  constructor(
    public loadingService: LoadingService,
    private syncService: SyncService,
    private router: Router
  ) {
    this.showSyncButton$ = this.syncService.isOnline();
    this.pendingRequestCount$ = this.syncService.getPendingRequestCount();
  }

  toggleCollapse(): void {
    this.sidenav.toggle();
  }

  collapseMenu(): void {
    this.sidenav.close();
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  onSyncNow(): void {
    this.syncService.processQueue();
  }
}