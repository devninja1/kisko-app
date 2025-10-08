import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { fromEvent, merge, of, Subject, BehaviorSubject, Observable, tap } from 'rxjs';
import { mapTo, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { Product } from '../../model/product.model';
import { Customer } from '../../model/customer.model';

export interface QueuedRequest {
  id?: number;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private destroy$ = new Subject<void>();
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(private http: HttpClient, private dbService: NgxIndexedDBService) {
    this.init();
  }

  private init(): void {
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(mapTo(true)),
      fromEvent(window, 'offline').pipe(mapTo(false))
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
    this.dbService.add('sync-queue', request).subscribe();
  }

  private processQueue(): void {
    this.dbService.getAll<QueuedRequest>('sync-queue').subscribe((requests) => {
      for (const req of requests) {
        this.http.request(req.method, req.url, { body: req.payload }).subscribe({
          next: (response: any) => {
            if (req.method === 'POST' && req.payload.tempId) {
              // This was an offline creation, we need to update the local record
              const storeName = req.url.includes('products') ? 'products' : 'customers';
              this.dbService.getByID(storeName, req.payload.tempId).subscribe((record: any) => {
                if (record) {
                  this.dbService.delete(storeName, req.payload.tempId).subscribe(() => {
                    this.dbService.add(storeName, response).subscribe();
                  });
                }
              });
            }
            // On success, remove from queue
            this.dbService.delete('sync-queue', req.id!).subscribe();
          },
          error: (err) => {
            console.error('Sync failed for request:', req, err);
            // Optionally, handle specific errors, e.g., 404 might mean the item was deleted on server
            if (err.status === 404) {
              this.dbService.delete('sync-queue', req.id!).subscribe();
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}