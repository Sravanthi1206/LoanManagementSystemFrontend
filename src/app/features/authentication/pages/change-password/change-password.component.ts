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
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  changePasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

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

  toggleOldPassword(): void { this.showOldPassword = !this.showOldPassword; }
  toggleNewPassword(): void { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

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
