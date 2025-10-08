import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';
import { MenuComponent } from '../menu/menu.component';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '../../core/services/loading.service';
import { SyncService } from '../../core/services/sync.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatButtonModule, MatProgressSpinnerModule, MenuComponent, RouterOutlet, MatSnackBarModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  isCollapsed = false;
  loadingService = inject(LoadingService);
  private syncService = inject(SyncService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private offlineSnackBarRef: MatSnackBarRef<any> | null = null;

  ngOnInit(): void {
    this.syncService.isOnline()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        if (!isOnline) {
          this.offlineSnackBarRef = this.snackBar.open('You are currently offline.', 'Dismiss', {
            panelClass: ['warn-snackbar']
          });
        } else {
          this.offlineSnackBarRef?.dismiss();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  collapseMenu(): void {
    this.isCollapsed = true;
  }
}