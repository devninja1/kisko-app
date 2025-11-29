import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Supplier } from '../../model/supplier.model';

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './supplier-dialog.component.html',
  styleUrl: './supplier-dialog.component.scss'
})
export class SupplierDialogComponent implements OnInit {
  supplierForm!: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier
  ) {
    this.isEditMode = !!data.id;
  }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      id: [this.data.id],
      name: [this.data.name, Validators.required],
      contact_person: [this.data.contact_person],
      phone: [this.data.phone],
      email: [this.data.email, Validators.email],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.supplierForm.valid) {
      this.dialogRef.close(this.supplierForm.value);
    }
  }
}