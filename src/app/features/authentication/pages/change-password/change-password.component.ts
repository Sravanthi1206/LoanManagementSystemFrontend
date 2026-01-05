import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <h2 class="mb-2">Change Password</h2>
          <p class="text-muted">You must change your password to continue</p>
        </div>

        <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label for="oldPassword" class="form-label">Old Password</label>
            <input
              type="password"
              class="form-control"
              id="oldPassword"
              formControlName="oldPassword"
              [class.is-invalid]="oldPassword?.invalid && oldPassword?.touched"
            />
            <div class="invalid-feedback" *ngIf="oldPassword?.invalid && oldPassword?.touched">
               <span *ngIf="oldPassword?.errors?.['required']">Old password is required</span>
            </div>
          </div>

          <div class="mb-3">
            <label for="newPassword" class="form-label">New Password</label>
            <input
              type="password"
              class="form-control"
              id="newPassword"
              formControlName="newPassword"
              [class.is-invalid]="newPassword?.invalid && newPassword?.touched"
            />
            <div class="invalid-feedback" *ngIf="newPassword?.invalid && newPassword?.touched">
              <span *ngIf="newPassword?.errors?.['required']">New password is required</span>
              <span *ngIf="newPassword?.errors?.['minlength']">Must be at least 8 characters</span>
            </div>
          </div>

          <div class="mb-3">
            <label for="confirmPassword" class="form-label">Confirm New Password</label>
            <input
              type="password"
              class="form-control"
              id="confirmPassword"
              formControlName="confirmPassword"
              [class.is-invalid]="confirmPassword?.invalid && confirmPassword?.touched"
            />
            <div class="invalid-feedback" *ngIf="changePasswordForm.errors?.['mismatch'] && confirmPassword?.touched">
              Passwords do not match
            </div>
          </div>

          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            [disabled]="changePasswordForm.invalid || loading"
          >
            <span *ngIf="!loading">Change Password</span>
            <span *ngIf="loading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Updating...
            </span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 20px;
    }

    .login-card {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 2.5rem;
      max-width: 400px;
      width: 100%;
    }
  `]
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  changePasswordForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get oldPassword() { return this.changePasswordForm.get('oldPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const user = this.authState.getUser();
      if (!user) {
        this.loading = false;
        this.errorMessage = 'User not authenticated';
        return;
      }

      this.authApi.changePassword(user.id, {
        oldPassword: this.changePasswordForm.value.oldPassword,
        newPassword: this.changePasswordForm.value.newPassword
      }).subscribe({
        next: () => {
          this.loading = false;
          // Update local user state
          const updatedUser = { ...user, passwordChangeRequired: false };
          const token = this.authState.getToken();
          if (token) {
            this.authState.setAuth(token, updatedUser);
          }

          this.redirectToDashboard(user.role);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Failed to change password';
        }
      });
    }
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'CUSTOMER':
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'LOAN_OFFICER':
        this.router.navigate(['/officer/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }
  }
}
