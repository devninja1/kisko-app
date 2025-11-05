import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map, shareReplay, take } from 'rxjs';

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
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    public loadingService: LoadingService,
    public syncService: SyncService,
    private router: Router
  ) {
    this.pendingRequestCount$ = this.syncService.getPendingRequestCount();
    this.showSyncButton$ = this.pendingRequestCount$.pipe(
      map(count => count > 0)
    );
  }

  toggleCollapse(): void {
    this.sidenav.toggle();
  }

  collapseMenu(): void {
    // Only close if not a large screen
    this.isHandset$.pipe(take(1)).subscribe(isHandset => {
      if (isHandset) {
        this.sidenav.close();
      }
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  onSyncNow(): void {
    this.syncService.processQueue();
  }
}