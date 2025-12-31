import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <h2 class="mb-2">Loan Management System</h2>
          <p class="text-muted">Sign in to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label for="email" class="form-label">Email Address</label>
            <input
              type="email"
              class="form-control"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.is-invalid]="email?.invalid && email?.touched"
            />
            <div class="invalid-feedback" *ngIf="email?.invalid && email?.touched">
              <span *ngIf="email?.errors?.['required']">Email is required</span>
              <span *ngIf="email?.errors?.['email']">Invalid email format</span>
            </div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                formControlName="password"
                placeholder="Enter your password"
                [class.is-invalid]="password?.invalid && password?.touched"
              />
              <button 
                type="button" 
                class="password-toggle-btn" 
                (click)="togglePasswordVisibility()"
                tabindex="-1"
              >
                <span *ngIf="!showPassword">👁️</span>
                <span *ngIf="showPassword">🙈</span>
              </button>
            </div>
            <div class="invalid-feedback" *ngIf="password?.invalid && password?.touched">
              <span *ngIf="password?.errors?.['required']">Password is required</span>
            </div>
          </div>

          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            [disabled]="loginForm.invalid || loading"
          >
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Signing in...
            </span>
          </button>

          <div class="text-center">
            <p class="mb-0">
              Don't have an account?
              <a routerLink="/auth/register" class="text-primary">Register here</a>
            </p>
          </div>
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

    .password-input-wrapper {
      position: relative;
    }

    .password-toggle-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.25rem 0.5rem;
      opacity: 0.6;
    }

    .password-toggle-btn:hover {
      opacity: 1;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authApi.login(this.loginForm.value).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Login failed. Please check your credentials.';
        }
      });
    }
  }
}
