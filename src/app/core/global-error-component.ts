import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { VypexNotificationService } from './vypex-notification-service';

@Component({
    selector: 'app-global-error-display',
    template: `
    <div *ngIf="errorMessage" class="global-error">
      {{ errorMessage }}
    </div>
    <div *ngIf="successMessage" class="global-success">
      {{ successMessage }}
    </div>
  `,
    styles: [`
    .global-error {
      position: fixed;
      top: 20px;
      left: 20px;
      background-color: #f44336;
      color: white;
      padding: 16px;
      z-index: 9999;
    }
    .global-success {
      position: fixed;
      top: 60px;
      left: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 16px;
      z-index: 9999;
    }
  `],
})
export class GlobalErrorDisplayComponent implements OnInit, OnDestroy {
    errorMessage: string | null = null;
    successMessage: string | null = null;
    private destroy$ = new Subject<void>();

    constructor(private notificationService: VypexNotificationService) { }

    ngOnInit(): void {
        this.notificationService.errors$.pipe(takeUntil(this.destroy$)).subscribe((message) => {
            this.errorMessage = message;
            setTimeout(() => this.errorMessage = null, 3000);
        });

        this.notificationService.successes$.pipe(takeUntil(this.destroy$)).subscribe((message) => {
            this.successMessage = message;
            setTimeout(() => this.successMessage = null, 3000);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
