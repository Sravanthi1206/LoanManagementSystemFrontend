import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { User, DashboardStats, Loan } from '../../../../shared/types/models';

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
  private router = inject(Router);

  currentUserId = computed(() => this.authState.getUser()?.id);

  stats = signal<DashboardStats | null>(null);
  loansByType = signal<{ [key: string]: number } | null>(null);
  loansByStatus = signal<{ [key: string]: number } | null>(null);
  totalDisbursed = signal<number>(0);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);

  searchQuery = signal('');
  sortField = signal<string>('id');
  sortDirection = signal<'asc' | 'desc'>('desc');

  currentPage = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);
  totalElements = signal(0);

  loading = signal(true);
  processing = signal(false);

  userToDeactivate = signal<User | null>(null);

  // Loan management signals
  officers = signal<(User & { pendingCount?: number })[]>([]);
  loansUnderReview = signal<Loan[]>([]);
  loanToReassign = signal<Loan | null>(null);
  selectedOfficerId: number | null = null;

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

    this.adminApi.getLoansByStatus().subscribe({
      next: (data) => this.loansByStatus.set(data),
      error: () => { }
    });

    this.adminApi.getTotalDisbursed().subscribe({
      next: (data) => this.totalDisbursed.set(data.totalDisbursed || 0),
      error: () => this.totalDisbursed.set(0)
    });

    this.loadUsers();
    this.loadOfficers();
    this.loadLoansUnderReview();
  }

  loadUsers(): void {
    this.adminApi.getAllUsers(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.applyFilters();
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.users()];

    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(user =>
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      );
    }

    // Apply sorting
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const aVal = (a as any)[field] || '';
      const bVal = (b as any)[field] || '';
      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * dir;
      }
      return (aVal - bVal) * dir;
    });

    this.filteredUsers.set(result);
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
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

  getLoanStatuses(): string[] {
    return ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED'];
  }

  getTotalLoans(): number {
    if (!this.loansByType()) return 1;
    return Object.values(this.loansByType()!).reduce((sum, val) => sum + val, 0) || 1;
  }

  getPercentage(count: number): number {
    return (count / this.getTotalLoans()) * 100;
  }

  viewUserDetails(user: User): void {
    this.router.navigate(['/admin/users', user.id]);
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
    this.router.navigate(['/admin/create-staff']);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-danger';
      case 'LOAN_OFFICER': return 'bg-primary';
      case 'CUSTOMER': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  // Vibrant color palette optimized for pie charts
  typeColors: { [key: string]: string } = {
    'HOME': '#4F46E5',       // Indigo
    'PERSONAL': '#059669',   // Emerald (darker)
    'VEHICLE': '#EA580C',    // Orange
    'EDUCATION': '#7C3AED',  // Purple
    'BUSINESS': '#DB2777'    // Pink
  };

  statusColors: { [key: string]: string } = {
    'APPLIED': '#0EA5E9',    // Sky Blue
    'UNDER_REVIEW': '#F59E0B', // Amber
    'APPROVED': '#10B981',   // Emerald
    'REJECTED': '#DC2626',   // Red
    'DISBURSED': '#8B5CF6',  // Violet
    'CLOSED': '#64748B'      // Slate
  };

  getStatusColor(status: string): string {
    return this.statusColors[status] || '#6B7280';
  }

  getLoanTypeColor(type: string): string {
    return this.typeColors[type] || '#6B7280';
  }

  // Generate conic-gradient for pie chart by type
  getTypePieGradient(): string {
    const data = this.loansByType();
    if (!data) return 'conic-gradient(#e5e7eb 0deg 360deg)';

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';

    let gradient = 'conic-gradient(';
    let currentAngle = 0;

    const types = this.getLoanTypes();
    types.forEach((type, index) => {
      const value = data[type] || 0;
      const angle = (value / total) * 360;
      const color = this.typeColors[type] || '#6B7280';

      gradient += `${color} ${currentAngle}deg ${currentAngle + angle}deg`;
      currentAngle += angle;

      if (index < types.length - 1) gradient += ', ';
    });

    gradient += ')';
    return gradient;
  }

  // Generate conic-gradient for pie chart by status
  getStatusPieGradient(): string {
    const data = this.loansByStatus();
    if (!data) return 'conic-gradient(#e5e7eb 0deg 360deg)';

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';

    let gradient = 'conic-gradient(';
    let currentAngle = 0;

    const statuses = this.getLoanStatuses();
    statuses.forEach((status, index) => {
      const value = data[status] || 0;
      const angle = (value / total) * 360;
      const color = this.statusColors[status] || '#6B7280';

      gradient += `${color} ${currentAngle}deg ${currentAngle + angle}deg`;
      currentAngle += angle;

      if (index < statuses.length - 1) gradient += ', ';
    });

    gradient += ')';
    return gradient;
  }

  // ============ Loan Admin Methods ============

  loadOfficers(): void {
    this.adminApi.getOfficerUsers().subscribe({
      next: (officerList) => {
        // For each officer, get their pending count
        const officersWithCount = officerList.map(officer => ({
          ...officer,
          pendingCount: 0
        }));
        this.officers.set(officersWithCount);

        // Load pending counts for each officer
        officerList.forEach((officer, index) => {
          this.adminApi.getOfficerPendingCount(officer.id).subscribe({
            next: (count) => {
              const updated = [...this.officers()];
              updated[index] = { ...updated[index], pendingCount: count };
              this.officers.set(updated);
            },
            error: () => { }
          });
        });
      },
      error: () => { }
    });
  }

  loadLoansUnderReview(): void {
    this.adminApi.getLoansUnderReview(0, 50).subscribe({
      next: (response) => {
        this.loansUnderReview.set(response.content || []);
      },
      error: () => { }
    });
  }

  showReassignModal(loan: Loan): void {
    this.loanToReassign.set(loan);
    this.selectedOfficerId = loan.assignedOfficerId || null;
  }

  confirmReassign(): void {
    const loan = this.loanToReassign();
    if (!loan || !this.selectedOfficerId) return;

    this.processing.set(true);
    this.adminApi.reassignLoan(loan.loanId, this.selectedOfficerId).subscribe({
      next: () => {
        this.showToast('Loan reassigned successfully', 'success');
        this.loanToReassign.set(null);
        this.selectedOfficerId = null;
        this.loadLoansUnderReview();
        this.loadOfficers();
        this.processing.set(false);
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to reassign loan', 'error');
        this.processing.set(false);
      }
    });
  }

  releaseLoan(loan: Loan): void {
    if (!confirm(`Release loan #${loan.loanId} back to the pool?`)) return;

    this.processing.set(true);
    this.adminApi.releaseLoan(loan.loanId).subscribe({
      next: () => {
        this.showToast('Loan released to pool', 'success');
        this.loadLoansUnderReview();
        this.loadOfficers();
        this.processing.set(false);
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to release loan', 'error');
        this.processing.set(false);
      }
    });
  }
}
