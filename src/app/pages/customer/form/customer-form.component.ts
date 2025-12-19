import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { Customer } from '../../../model/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent {
  customerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CustomerFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer }
  ) {
    const c = data.customer;
    this.customerForm = this.fb.group({
      name: [c?.name || '', Validators.required],
      phone_number: [c?.phone_number || '', Validators.required],
      place: [c?.place || ''],
      type: [c?.type || 'regular'],
      display_order: [c?.display_order ?? 0, [Validators.min(0)]],
      is_active: [c?.is_active ?? true],
      date_added: [c?.date_added || new Date().toISOString()],
    });
  }

  onSave(): void {
    if (this.customerForm.valid) {
      this.dialogRef.close(this.customerForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}