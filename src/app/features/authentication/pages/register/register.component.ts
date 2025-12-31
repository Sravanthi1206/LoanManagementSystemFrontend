import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="text-center mb-4">
          <h2 class="mb-2">Create Account</h2>
          <p class="text-muted">Register as a customer</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="row">
            <div class="col-6 mb-3">
              <label for="firstName" class="form-label">First Name</label>
              <input
                type="text"
                class="form-control"
                id="firstName"
                formControlName="firstName"
                placeholder="First name"
                [class.is-invalid]="firstName?.invalid && firstName?.touched"
              />
              <div class="invalid-feedback" *ngIf="firstName?.invalid && firstName?.touched">
                First name is required (2-100 chars)
              </div>
            </div>
            <div class="col-6 mb-3">
              <label for="lastName" class="form-label">Last Name</label>
              <input
                type="text"
                class="form-control"
                id="lastName"
                formControlName="lastName"
                placeholder="Last name"
                [class.is-invalid]="lastName?.invalid && lastName?.touched"
              />
              <div class="invalid-feedback" *ngIf="lastName?.invalid && lastName?.touched">
                Last name is required (2-100 chars)
              </div>
            </div>
          </div>

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
                placeholder="Create a strong password"
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
            <small class="text-muted">Min 8 chars with uppercase, lowercase, number & special character</small>
            <div class="invalid-feedback d-block" *ngIf="password?.invalid && password?.touched">
              <span *ngIf="password?.errors?.['required']">Password is required</span>
              <span *ngIf="password?.errors?.['pattern']">Must have uppercase, lowercase, number & special char</span>
            </div>
          </div>

          <div class="mb-3">
            <label for="phone" class="form-label">Phone Number</label>
            <input
              type="tel"
              class="form-control"
              id="phone"
              formControlName="phone"
              placeholder="10-digit mobile number"
              [class.is-invalid]="phone?.invalid && phone?.touched"
            />
            <div class="invalid-feedback" *ngIf="phone?.invalid && phone?.touched">
              <span *ngIf="phone?.errors?.['required']">Phone number is required</span>
              <span *ngIf="phone?.errors?.['pattern']">Invalid phone number format</span>
            </div>
          </div>

          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-success w-100 mb-3"
            [disabled]="registerForm.invalid || loading"
          >
            <span *ngIf="!loading">Register</span>
            <span *ngIf="loading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Creating account...
            </span>
          </button>

          <div class="text-center">
            <p class="mb-0">
              Already have an account?
              <a routerLink="/auth/login" class="text-primary">Sign in here</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 20px;
    }

    .register-card {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 2.5rem;
      max-width: 450px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/)
      ]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]]
    });
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get phone() {
    return this.registerForm.get('phone');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authApi.register(this.registerForm.value).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}

