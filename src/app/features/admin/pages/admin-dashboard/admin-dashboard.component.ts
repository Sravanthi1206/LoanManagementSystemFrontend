import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { User, DashboardStats } from '../../../../shared/types/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  protected Math = Math;
  protected loanUtils = inject(LoanUtilsService);
  private adminApi = inject(AdminApiService);
  private authState = inject(AuthStateService);

  currentUserId = computed(() => this.authState.getUser()?.id);

  stats = signal<DashboardStats | null>(null);
  loansByType = signal<{ [key: string]: number } | null>(null);
  users = signal<User[]>([]);

  currentPage = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);
  totalElements = signal(0);

  loading = signal(true);
  processing = signal(false);

  selectedUser = signal<User | null>(null);
  userToDeactivate = signal<User | null>(null);
  showStaffModal = signal(false);

  staffForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: ''
  };

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

    this.loadUsers();
  }

  loadUsers(): void {
    this.adminApi.getAllUsers(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    return range;
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



  viewUserDetails(user: User): void {
    this.selectedUser.set(user);
  }

  canDeactivate(user: User): boolean {
    const currentId = this.currentUserId();
    return user.id !== currentId;
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
    this.staffForm = { firstName: '', lastName: '', email: '', phone: '', password: '', role: '' };
    this.showStaffModal.set(true);
  }

  isStaffFormValid(): boolean {
    const phoneValid = /^\d{10}$/.test(this.staffForm.phone);
    return !!(this.staffForm.firstName && this.staffForm.lastName &&
      this.staffForm.email && phoneValid && this.staffForm.password && this.staffForm.role);
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
