import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface PaymentDialogData {
  balance: number;
  grandTotal: number;
  paymentAmount?: number;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h1 mat-dialog-title>Record a Payment</h1>
    <div mat-dialog-content>
      <p>Current outstanding balance is <strong>{{ data.balance | currency:'INR' }}</strong>.</p>
      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>Payment Amount</mat-label>
        <input matInput type="number" [(ngModel)]="paymentAmount" [max]="data.balance" min="0.01" placeholder="0.00" cdkFocusInitial>
        <span matTextPrefix>₹&nbsp;</span>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="paymentAmount" [disabled]="!paymentAmount || paymentAmount <= 0 || paymentAmount > data.balance">Save Payment</button>
    </div>
  `
})
export class PaymentDialogComponent {
  paymentAmount: number;

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
  ) {
    this.paymentAmount = data.paymentAmount || 0;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}