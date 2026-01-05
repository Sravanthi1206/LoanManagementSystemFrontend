import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { User } from '../../../../shared/types/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

              <form *ngIf="!loading() && user()" (ngSubmit)="saveProfile()">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control" [(ngModel)]="firstName" name="firstName" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control" [(ngModel)]="lastName" name="lastName" required>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" [value]="user()?.email" disabled>
                  <small class="text-muted">Email cannot be changed</small>
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone</label>
                  <input type="tel" class="form-control" [(ngModel)]="phone" name="phone" required
                         pattern="^\\+?[1-9]\\d{9,14}$" placeholder="+919876543210">
                </div>

                <div class="mb-3">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" class="form-control" [(ngModel)]="dateOfBirth" name="dateOfBirth">
                </div>

                <div class="mb-3">
                  <label class="form-label">PAN Card</label>
                  <input type="text" class="form-control" [(ngModel)]="panCard" name="panCard" 
                         pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" placeholder="ABCDE1234F">
                </div>

                <hr class="my-4">
                <p class="text-muted d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <strong>Enter your password to save changes:</strong>
                </p>

                <div class="mb-3">
                  <label class="form-label">Password <span class="text-danger">*</span></label>
                  <div class="password-input-wrapper">
                    <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="password" name="password" 
                           required placeholder="Enter your password to confirm changes">
                    <button type="button" class="password-toggle-btn" (click)="showPassword = !showPassword" tabindex="-1">
                      <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    </button>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || !password">
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
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  user = signal<User | null>(null);
  loading = signal(true);
  saving = signal(false);
  message = signal('');
  isError = signal(false);

  firstName = '';
  lastName = '';
  phone = '';
  dateOfBirth = '';
  panCard = '';
  password = '';
  showPassword = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    const currentUser = this.authState.getUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.firstName = currentUser.firstName || '';
      this.lastName = currentUser.lastName || '';
      this.phone = currentUser.phone || '';
      this.dateOfBirth = currentUser.dateOfBirth || '';
      this.panCard = currentUser.panCard || '';
      this.loading.set(false);
    }
  }

  saveProfile(): void {
    const currentUser = this.user();
    if (!currentUser || !this.password) return;

    this.saving.set(true);
    this.message.set('');

    const updateData = {
      email: currentUser.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth || null,
      panCard: this.panCard || null
    };

    this.loanApi.updateUserProfile(currentUser.id, updateData).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Profile updated successfully!');
        this.isError.set(false);
        this.password = '';
        // Update local storage
        const storedUser = this.authState.getUser();
        if (storedUser) {
          const merged = { ...storedUser, firstName: this.firstName, lastName: this.lastName, phone: this.phone, dateOfBirth: this.dateOfBirth, panCard: this.panCard };
          localStorage.setItem('user', JSON.stringify(merged));
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.message.set(err.error?.message || 'Failed to update profile. Check your password.');
        this.isError.set(true);
        this.password = '';
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}
