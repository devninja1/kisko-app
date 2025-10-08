import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SyncService, QueuedRequest, FailedRequest } from '../../core/services/sync.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sync-status.component.html',
  styleUrl: './sync-status.component.scss'
})
export class SyncStatusComponent implements OnInit {
  pendingRequests$!: Observable<QueuedRequest[]>;
  failedRequests$!: Observable<FailedRequest[]>;

  constructor(private syncService: SyncService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.pendingRequests$ = this.syncService.getPendingRequests();
    this.failedRequests$ = this.syncService.getFailedRequests();
  }

  retryRequest(request: FailedRequest): void {
    this.syncService.retryFailedRequest(request).subscribe(() => {
      this.snackBar.open('Request re-queued for sync.', 'OK', { duration: 3000 });
    });
  }

  deleteFailedRequest(id: number): void {
    this.syncService.deleteFailedRequest(id).subscribe(() => {
      this.snackBar.open('Failed request deleted.', 'OK', { duration: 3000 });
    });
  }

  retryAllFailedRequests(): void {
    this.syncService.retryAllFailedRequests().subscribe(() => {
      this.snackBar.open('All failed requests re-queued for sync.', 'OK', { duration: 3000 });
    });
  }
}