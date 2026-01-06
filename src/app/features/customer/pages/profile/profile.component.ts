import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { User } from '../../../../shared/types/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">My Profile</h4>
            </div>
            <div class="card-body">
              <div *ngIf="loading()" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading profile...</p>
              </div>

              <form *ngIf="!loading() && user()" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control" formControlName="firstName">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control" formControlName="lastName">
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" [value]="user()?.email" disabled>
                  <small class="text-muted">Email cannot be changed</small>
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone</label>
                  <input type="tel" class="form-control" formControlName="phone" placeholder="+919876543210">
                </div>

                <div class="mb-3">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" class="form-control" formControlName="dateOfBirth">
                </div>

                <div class="mb-3">
                  <label class="form-label">PAN Card</label>
                  <input type="text" class="form-control" formControlName="panCard" placeholder="ABCDE1234F">
                </div>

                <hr class="my-4">
                <p class="text-muted d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <strong>Enter your password to save changes:</strong>
                </p>

                <div class="mb-3">
                  <label class="form-label">Password <span class="text-danger">*</span></label>
                  <div class="password-input-wrapper">
                    <input [type]="showPassword ? 'text' : 'password'" class="form-control" formControlName="password" 
                           placeholder="Enter your password to confirm changes">
                    <button type="button" class="password-toggle-btn" (click)="showPassword = !showPassword" tabindex="-1">
                      <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    </button>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || profileForm.get('password')?.invalid">
                    <span *ngIf="!saving()">Save Changes</span>
                    <span *ngIf="saving()">
                      <span class="spinner-border spinner-border-sm me-2"></span>Saving...
                    </span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" (click)="goBack()">Cancel</button>
                </div>

                <div *ngIf="message()" class="alert mt-3" [class.alert-success]="!isError()" [class.alert-danger]="isError()">
                  {{ message() }}
                </div>
              </form>
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0">Account Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Role:</strong> {{ user()?.role }}</p>
                  <p><strong>Account Status:</strong> 
                    <span [class]="user()?.active ? 'badge bg-success' : 'badge bg-danger'">
                      {{ user()?.active ? 'Active' : 'Inactive' }}
                    </span>
                  </p>
                </div>
                <div class="col-md-6">
                  <p><strong>Member Since:</strong> {{ user()?.createdAt | date: 'mediumDate' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .form-label {
      font-weight: 500;
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
      font-size: 1.1rem;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  user = signal<User | null>(null);
  loading = signal(true);
  saving = signal(false);
  message = signal('');
  isError = signal(false);
  showPassword = false;

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]],
      dateOfBirth: [''],
      panCard: ['', Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    const currentUser = this.authState.getUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.profileForm.patchValue({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        dateOfBirth: currentUser.dateOfBirth || '',
        panCard: currentUser.panCard || ''
      });
      this.loading.set(false);
    }
  }

  saveProfile(): void {
    const currentUser = this.user();
    if (!currentUser || this.profileForm.get('password')?.invalid) return;

    this.saving.set(true);
    this.message.set('');

    const formValue = this.profileForm.value;
    const updateData = {
      email: currentUser.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth || null,
      panCard: formValue.panCard || null
    };

    this.loanApi.updateUserProfile(currentUser.id, updateData).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Profile updated successfully!');
        this.isError.set(false);
        this.profileForm.patchValue({ password: '' });
        // Update auth state properly
        const storedUser = this.authState.getUser();
        const token = localStorage.getItem('token');
        if (storedUser && token) {
          const merged = {
            ...storedUser,
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            phone: formValue.phone,
            dateOfBirth: formValue.dateOfBirth,
            panCard: formValue.panCard
          };
          this.authState.setAuth(token, merged);
          this.user.set(merged);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.message.set(err.error?.message || 'Failed to update profile. Check your password.');
        this.isError.set(true);
        this.profileForm.patchValue({ password: '' });
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}
