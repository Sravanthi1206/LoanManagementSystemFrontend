import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { User, DashboardStats } from '../../../../shared/types/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2>Admin Dashboard</h2>
          <p class="text-muted">System overview and user management</p>
        </div>
      </div>

      <!-- Toast Notification -->
      <div *ngIf="toastMessage()" class="toast-notification" [class.toast-success]="toastType() === 'success'" [class.toast-error]="toastType() === 'error'">
        {{ toastMessage() }}
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card stat-card bg-primary text-white">
            <div class="card-body">
              <h3>{{ stats()?.totalLoans || 0 }}</h3>
              <p class="mb-0">Total Loans</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-success text-white">
            <div class="card-body">
              <h3>{{ stats()?.approvedLoans || 0 }}</h3>
              <p class="mb-0">Approved</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-info text-white">
            <div class="card-body">
              <h3>{{ stats()?.disbursedLoans || 0 }}</h3>
              <p class="mb-0">Disbursed</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-warning text-white">
            <div class="card-body">
              <h3>{{ users().length }}</h3>
              <p class="mb-0">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loan Distribution -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Loan Distribution by Type</h5>
            </div>
            <div class="card-body">
              <div *ngIf="loansByType()">
                <div *ngFor="let type of getLoanTypes()" class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span>{{ getLoanTypeDisplay(type) }}</span>
                    <span>{{ loansByType()![type] || 0 }}</span>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar" [style.width.%]="getPercentage(loansByType()![type] || 0)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-primary w-100 mb-3" (click)="showCreateStaffModal()">
                Create Staff Account
              </button>
              <button class="btn btn-outline-secondary w-100" (click)="refreshData()">
                Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">User Management</h5>
            </div>
            <div class="card-body">
              <div *ngIf="loading()" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading users...</p>
              </div>

              <div *ngIf="!loading() && users().length === 0" class="text-center py-4">
                <p class="text-muted">No users found</p>
              </div>

              <div *ngIf="!loading() && users().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let user of users()">
                      <td>{{ user.id }}</td>
                      <td>{{ user.firstName }} {{ user.lastName }}</td>
                      <td>{{ user.email }}</td>
                      <td><span class="badge bg-secondary">{{ user.role }}</span></td>
                      <td>
                        <span [class]="user.active ? 'badge bg-success' : 'badge bg-danger'">
                          {{ user.active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-info me-1" (click)="viewUserDetails(user)">
                          View
                        </button>
                        <button *ngIf="user.active && canDeactivate(user)" class="btn btn-sm btn-outline-danger"
                                (click)="showDeactivateConfirm(user)" [disabled]="processing()">
                          Deactivate
                        </button>
                        <span *ngIf="user.active && !canDeactivate(user)" class="text-muted small">
                          (Cannot deactivate self)
                        </span>
                        <button *ngIf="!user.active" class="btn btn-sm btn-outline-success"
                                (click)="activateUser(user)" [disabled]="processing()">
                          Activate
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div class="modal-overlay" *ngIf="selectedUser()" (click)="selectedUser.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">User Details</h5>
            <button type="button" class="btn-close" (click)="selectedUser.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>ID:</strong> {{ selectedUser()?.id }}</p>
            <p><strong>Name:</strong> {{ selectedUser()?.firstName }} {{ selectedUser()?.lastName }}</p>
            <p><strong>Email:</strong> {{ selectedUser()?.email }}</p>
            <p><strong>Phone:</strong> {{ selectedUser()?.phone || 'N/A' }}</p>
            <p><strong>Role:</strong> {{ selectedUser()?.role }}</p>
            <p><strong>Status:</strong> 
              <span [class]="selectedUser()?.active ? 'badge bg-success' : 'badge bg-danger'">
                {{ selectedUser()?.active ? 'Active' : 'Inactive' }}
              </span>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="selectedUser.set(null)">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div class="modal-overlay" *ngIf="userToDeactivate()" (click)="userToDeactivate.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Deactivation</h5>
            <button type="button" class="btn-close" (click)="userToDeactivate.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to deactivate <strong>{{ userToDeactivate()?.firstName }} {{ userToDeactivate()?.lastName }}</strong>?</p>
            <p class="text-muted">The user will no longer be able to access the system.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="userToDeactivate.set(null)">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDeactivate()" [disabled]="processing()">
              <span *ngIf="!processing()">Deactivate</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Staff Modal -->
    <div class="modal-overlay" *ngIf="showStaffModal()" (click)="showStaffModal.set(false)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Staff Account</h5>
            <button type="button" class="btn-close" (click)="showStaffModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">First Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="staffForm.firstName" placeholder="Enter first name">
            </div>
            <div class="mb-3">
              <label class="form-label">Last Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="staffForm.lastName" placeholder="Enter last name">
            </div>
            <div class="mb-3">
              <label class="form-label">Email <span class="text-danger">*</span></label>
              <input type="email" class="form-control" [(ngModel)]="staffForm.email" placeholder="Enter email">
            </div>
            <div class="mb-3">
              <label class="form-label">Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control" [(ngModel)]="staffForm.password" placeholder="Enter password">
            </div>
            <div class="mb-3">
              <label class="form-label">Role <span class="text-danger">*</span></label>
              <select class="form-control" [(ngModel)]="staffForm.role">
                <option value="">Select role</option>
                <option value="LOAN_OFFICER">Loan Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showStaffModal.set(false)">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirmCreateStaff()" 
                    [disabled]="!isStaffFormValid() || processing()">
              <span *ngIf="!processing()">Create Account</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Creating...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      border: none;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      font-size: 2rem;
      font-weight: 700;
    }
    .card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }
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
      width: 95%;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    }
    .toast-success { background: #28a745; }
    .toast-error { background: #dc3545; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private authState = inject(AuthStateService);

  // Current user ID for self-protection
  currentUserId = computed(() => this.authState.getUser()?.id);

  stats = signal<DashboardStats | null>(null);
  loansByType = signal<{ [key: string]: number } | null>(null);
  users = signal<User[]>([]);
  loading = signal(true);
  processing = signal(false);

  // Modal states
  selectedUser = signal<User | null>(null);
  userToDeactivate = signal<User | null>(null);
  showStaffModal = signal(false);

  // Staff form
  staffForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: ''
  };

  // Toast
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit(): void {
    this.loadDashboardData();
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  loadDashboardData(): void {
    this.loading.set(true);

    this.adminApi.getDashboardStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => { }
    });

    this.adminApi.getLoansByType().subscribe({
      next: (data) => this.loansByType.set(data),
      error: () => { }
    });

    this.adminApi.getAllUsers().subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  refreshData(): void {
    this.loadDashboardData();
    this.showToast('Dashboard refreshed');
  }

  getLoanTypes(): string[] {
    return ['HOME', 'PERSONAL', 'VEHICLE', 'EDUCATION', 'BUSINESS'];
  }

  getTotalLoans(): number {
    if (!this.loansByType()) return 1;
    return Object.values(this.loansByType()!).reduce((sum, val) => sum + val, 0) || 1;
  }

  getPercentage(count: number): number {
    return (count / this.getTotalLoans()) * 100;
  }

  getLoanTypeDisplay(type: string): string {
    const types: { [key: string]: string } = {
      'HOME': 'Home Loan',
      'PERSONAL': 'Personal Loan',
      'VEHICLE': 'Vehicle Loan',
      'EDUCATION': 'Education Loan',
      'BUSINESS': 'Business Loan'
    };
    return types[type] || type;
  }

  viewUserDetails(user: User): void {
    this.selectedUser.set(user);
  }

  // Check if admin can deactivate this user
  canDeactivate(user: User): boolean {
    const currentId = this.currentUserId();

    // Cannot deactivate self
    if (user.id === currentId) {
      return false;
    }

    // Cannot deactivate the last active admin
    if (user.role === 'ADMIN') {
      const activeAdmins = this.users().filter(u =>
        u.role === 'ADMIN' && u.active
      );
      if (activeAdmins.length <= 1) {
        return false;
      }
    }

    return true;
  }

  showDeactivateConfirm(user: User): void {
    this.userToDeactivate.set(user);
  }

  confirmDeactivate(): void {
    const user = this.userToDeactivate();
    if (!user) return;

    this.processing.set(true);
    this.adminApi.deactivateUser(user.id).subscribe({
      next: () => {
        this.processing.set(false);
        this.userToDeactivate.set(null);
        this.showToast('User deactivated successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Failed to deactivate user', 'error');
      }
    });
  }

  activateUser(user: User): void {
    this.processing.set(true);
    this.adminApi.activateUser(user.id).subscribe({
      next: () => {
        this.processing.set(false);
        this.showToast('User activated successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Failed to activate user', 'error');
      }
    });
  }

  showCreateStaffModal(): void {
    this.staffForm = { firstName: '', lastName: '', email: '', password: '', role: '' };
    this.showStaffModal.set(true);
  }

  isStaffFormValid(): boolean {
    return !!(this.staffForm.firstName && this.staffForm.lastName &&
      this.staffForm.email && this.staffForm.password && this.staffForm.role);
  }

  confirmCreateStaff(): void {
    if (!this.isStaffFormValid()) return;

    this.processing.set(true);
    this.adminApi.createStaffAccount(this.staffForm).subscribe({
      next: () => {
        this.processing.set(false);
        this.showStaffModal.set(false);
        this.showToast('Staff account created successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Failed to create staff account', 'error');
      }
    });
  }
}
