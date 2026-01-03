import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-create-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Staff Account</h5>
            <button type="button" class="btn-close" (click)="close()"></button>
          </div>
          <form [formGroup]="staffForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" formControlName="name" 
                       placeholder="Enter full name">
              </div>

              <div class="mb-3">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-control" formControlName="email" 
                       placeholder="Enter email">
              </div>

              <div class="mb-3">
                <label class="form-label">Password *</label>
                <input type="password" class="form-control" formControlName="password" 
                       placeholder="Create password" minlength="6">
              </div>

              <div class="mb-3">
                <label class="form-label">Phone Number *</label>
                <input type="tel" class="form-control" formControlName="phoneNumber" 
                       placeholder="10-digit mobile number">
              </div>

              <div class="mb-3">
                <label class="form-label">Address *</label>
                <textarea class="form-control" formControlName="address" 
                          rows="2" placeholder="Enter address"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Role *</label>
                <select class="form-control" formControlName="role">
                  <option value="">Select role</option>
                  <option value="LOAN_OFFICER">Loan Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div *ngIf="errorMessage()" class="alert alert-danger">
                {{ errorMessage() }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="staffForm.invalid || loading()">
                <span *ngIf="!loading()">Create Account</span>
                <span *ngIf="loading()">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    .modal-dialog {
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #dee2e6;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  `]
})
export class CreateStaffComponent {
  private fb = inject(FormBuilder);
  private adminApi = inject(AdminApiService);

  isOpen = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  onSuccess?: () => void;

  staffForm: FormGroup;

  constructor() {
    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      address: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  open(onSuccess?: () => void): void {
    this.isOpen.set(true);
    this.onSuccess = onSuccess;
    this.staffForm.reset();
    this.errorMessage.set('');
  }

  close(): void {
    this.isOpen.set(false);
    this.staffForm.reset();
  }

  onSubmit(): void {
    if (this.staffForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.adminApi.createStaffAccount(this.staffForm.value).subscribe({
        next: (response) => {
          this.loading.set(false);
          alert(`Staff account created successfully! User ID: ${response.id}`);
          this.close();
          if (this.onSuccess) this.onSuccess();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.message || 'Failed to create staff account');
        }
      });
    }
  }
}
