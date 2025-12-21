import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { fromEvent, merge, of, Subject, BehaviorSubject, Observable, tap, switchMap, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

export interface QueuedRequest {
  id?: number;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
}

export interface FailedRequest extends QueuedRequest {
  error: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private destroy$ = new Subject<void>();
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);
  private pendingRequests$ = new BehaviorSubject<QueuedRequest[]>([]);
  private failedRequests$ = new BehaviorSubject<FailedRequest[]>([]);

  constructor(
    private http: HttpClient,
    private dbService: NgxIndexedDBService,
    private snackBar: MatSnackBar
  ) {
    this.init();
    this.refreshQueues();
  }

  private init(): void {
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(isOnline => {
      this.online$.next(isOnline);
      if (isOnline) {
        this.processQueue();
      }
    });
  }

  isOnline(): Observable<boolean> {
    return this.online$.asObservable();
  }

  addToQueue(request: QueuedRequest): void {
    this.dbService.add('sync-queue', request).subscribe(() => {
      this.refreshQueues();
    });
  }

  getPendingRequestCount(): Observable<number> {
    return this.pendingRequests$.pipe(
      map(reqs => reqs.length),
      distinctUntilChanged()
    );
  }

  getPendingRequests(): Observable<QueuedRequest[]> {
    return this.pendingRequests$.asObservable();
  }

  getFailedRequests(): Observable<FailedRequest[]> {
    return this.failedRequests$.asObservable();
  }

  private refreshQueues(): void {
    this.dbService.getAll<QueuedRequest>('sync-queue').subscribe(reqs => this.pendingRequests$.next(reqs));
    this.dbService.getAll<FailedRequest>('failed-sync-queue').subscribe(reqs => this.failedRequests$.next(reqs));
  }

  public processQueue(): void {
    this.dbService.getAll<QueuedRequest>('sync-queue').subscribe((requests) => {
      for (const req of requests) {
        this.http.request(req.method, req.url, { body: req.payload }).subscribe({
          next: (response: any) => {
            if (req.method === 'POST' && req.payload?.tempId) {
              this.snackBar.open('An item was synced successfully.', 'Close', { duration: 2000 });
              // This was an offline creation, we need to update the local record
              let storeName;
              if (req.url.includes('products')) {
                storeName = 'products';
              } else if (req.url.includes('customers')) {
                storeName = 'customers';
              } else if (req.url.includes('sales')) {
                storeName = 'sales';
              } else if (req.url.includes('purchases')) {
                storeName = 'purchases';
              }
              if (storeName) {
                this.handleSuccessfulPost(storeName, req.payload.tempId, response);
              }
            }
            // On success, remove from queue
            this.dbService.delete('sync-queue', req.id!).subscribe(() => {
              if (req.method !== 'POST') this.snackBar.open('An item was synced successfully.', 'Close', { duration: 2000 });
              this.refreshQueues();
            });
          },
          error: (err) => {
            console.error('Sync failed for request:', req, err);
            if (err.status === 404) {
              // The resource was not found on the server.
              if (req.method === 'PUT' || req.method === 'PATCH') {
                // CONFLICT: The item was edited offline, but deleted on the server.
                const storeName = req.url.includes('products') ? 'products' : 'customers';
                const id = Number(req.url.split('/').pop());
                if (!isNaN(id)) {
                  // 1. Remove the stale item from local DB
                  this.dbService.delete(storeName, id).subscribe();
                  // 2. Notify the user
                  this.snackBar.open(
                    `An item you edited offline was deleted by another user. Your changes could not be saved.`,
                    'OK',
                    { duration: 7000, panelClass: ['warn-snackbar'] }
                  );
                }
              }
              // For POST, a 404 on the base URL is a server issue, let the error interceptor handle it.
              // For DELETE, a 404 means it's already gone, which is a success state for our purpose.

              // 3. Clean up the failed/irrelevant request from the queue.
              this.dbService.delete('sync-queue', req.id!).subscribe(() => {
                this.refreshQueues();
              });
            }
            // For any other error, move it to the failed queue
            else {
              this.moveToFailedQueue(req, err);
            }
          }
        });
      }
    });
  }

  private handleSuccessfulPost(storeName: string, tempId: number, serverResponse: any) {
    this.dbService.getByID(storeName, tempId).subscribe((record: any) => {
      if (record) {
        // Delete the temporary local record
        this.dbService.delete(storeName, tempId).subscribe(() => {
          // Add the permanent record from the server
          this.dbService.add(storeName, serverResponse).subscribe();
        });
      }
    });
  }

  private moveToFailedQueue(request: QueuedRequest, error: any) {
    const failedRequest: FailedRequest = {
      ...request,
      error: error.message || 'An unknown error occurred during sync.',
      timestamp: new Date()
    };
    this.dbService.add('failed-sync-queue', failedRequest).subscribe(() => {
      this.dbService.delete('sync-queue', request.id!).subscribe(() => {
        this.refreshQueues();
      });
    });
  }

  retryFailedRequest(request: FailedRequest): Observable<any> {
    this.addToQueue({ url: request.url, method: request.method, payload: request.payload });
    return this.dbService.delete('failed-sync-queue', request.id!).pipe(tap(() => this.refreshQueues()));
  }

  retryAllFailedRequests(): Observable<any> {
    return this.dbService.getAll<FailedRequest>('failed-sync-queue').pipe(
      switchMap(failedRequests => {
        if (failedRequests.length === 0) {
          return of(null);
        }
        const reQueueOps = failedRequests.map(req => ({
          url: req.url, method: req.method, payload: req.payload
        }));
        // Use bulk add to re-queue all failed requests
        return this.dbService.bulkAdd('sync-queue', reQueueOps).pipe(
          // Then clear the failed queue
          switchMap(() => this.dbService.clear('failed-sync-queue'))
        );
      }),
      tap(() => this.refreshQueues())
    );
  }

  deleteFailedRequest(id: number): Observable<any> {
    return this.dbService.delete('failed-sync-queue', id).pipe(tap(() => this.refreshQueues()));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}