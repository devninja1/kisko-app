import { Component, Inject, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface PaymentDialogData {
  balance: number;
  paymentAmount?: number;
}

@Component({
  selector: 'app-sales-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CurrencyPipe,
  ],
  template: `
    <h1 mat-dialog-title>{{ data.paymentAmount ? 'Edit Payment' : 'Add Payment' }}</h1>
    <div mat-dialog-content>
      <p>Current balance due: {{ data.balance | currency }}</p>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Payment Amount</mat-label>
        <input matInput type="number" [formControl]="amountControl" cdkFocusInitial>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="amountControl.value" [disabled]="amountControl.invalid">
        {{ data.paymentAmount ? 'Update' : 'Record Payment' }}
      </button>
    </div>
  `,
})
export class SalesPaymentDialogComponent {
  amountControl: FormControl<number>;

  public dialogRef = inject(MatDialogRef<SalesPaymentDialogComponent>);
  public data: PaymentDialogData = inject(MAT_DIALOG_DATA);

  constructor() {
    this.amountControl = new FormControl(this.data.paymentAmount ?? 0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01), Validators.max(this.data.balance)],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}