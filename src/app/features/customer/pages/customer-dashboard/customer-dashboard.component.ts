import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { Loan, EmiSchedule, WalletBalance } from '../../../../shared/types/models';
import { CreateServiceRequestComponent } from '../../containers/create-service-request/create-service-request.component';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, CreateServiceRequestComponent],
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2>Welcome, {{ userName() }}!</h2>
          <p class="text-muted">Manage your loans and payments</p>
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
              <h3>{{ myLoans().length }}</h3>
              <p class="mb-0">Total Loans</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-success text-white">
            <div class="card-body">
              <h3>{{ activeLoansCount() }}</h3>
              <p class="mb-0">Active Loans</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-warning text-white">
            <div class="card-body">
              <h3>{{ upcomingEmis().length }}</h3>
              <p class="mb-0">Upcoming EMIs</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-info text-white">
            <div class="card-body">
              <h3>₹{{ walletBalance()?.balance || 0 | number }}</h3>
              <p class="mb-0">Wallet Balance</p>
            </div>
          </div>
        </div>
      </div>

      <!-- My Loans -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">My Loans</h5>
              <button class="btn btn-primary btn-sm" (click)="showApplyLoanModal()">
                Apply for New Loan
              </button>
            </div>
            <div class="card-body">
              <div *ngIf="loading()" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading loans...</p>
              </div>

              <div *ngIf="!loading() && myLoans().length === 0" class="text-center py-4">
                <p class="text-muted">No loans found. Apply for your first loan!</p>
              </div>

              <div *ngIf="!loading() && myLoans().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Applied On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of myLoans()">
                      <td>#{{ loan.loanId }}</td>
                      <td>{{ getLoanTypeDisplay(loan.type) }}</td>
                      <td>₹{{ loan.amountRequested | number }}</td>
                      <td>
                        <span [class]="'badge ' + getStatusBadgeClass(loan.status)">
                          {{ getStatusDisplay(loan.status) }}
                        </span>
                      </td>
                      <td>{{ loan.appliedOn | date: 'shortDate' }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                (click)="viewLoanDetails(loan)">
                          View
                        </button>
                        <button *ngIf="loan.status === 'APPLIED'" 
                                class="btn btn-sm btn-outline-danger"
                                (click)="showWithdrawConfirm(loan)">
                          Withdraw
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

      <!-- Upcoming EMIs -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Upcoming EMI Payments</h5>
            </div>
            <div class="card-body">
              <div *ngIf="upcomingEmis().length === 0" class="text-center py-4">
                <p class="text-muted">No upcoming EMI payments</p>
              </div>

              <div *ngIf="upcomingEmis().length > 0" class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Installment #</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let emi of upcomingEmis()">
                      <td>#{{ emi.loanId }}</td>
                      <td>{{ emi.installmentNo }}</td>
                      <td>{{ emi.dueDate | date: 'mediumDate' }}</td>
                      <td>₹{{ emi.totalEmi | number }}</td>
                      <td>
                        <span [class]="'badge ' + getStatusBadgeClass(emi.status)">
                          {{ emi.status }}
                        </span>
                      </td>
                      <td>
                        <button *ngIf="emi.status === 'PENDING'" 
                                class="btn btn-sm btn-success"
                                (click)="showPayEmiConfirm(emi)">
                          Pay Now
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

    <!-- Loan Details Modal -->
    <div class="modal-overlay" *ngIf="selectedLoan()" (click)="selectedLoan.set(null)">
      <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Loan Details #{{ selectedLoan()?.loanId }}</h5>
            <button type="button" class="btn-close" (click)="selectedLoan.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Type:</strong> {{ getLoanTypeDisplay(selectedLoan()?.type || '') }}</p>
                <p><strong>Amount Requested:</strong> ₹{{ selectedLoan()?.amountRequested | number }}</p>
                <p><strong>Tenure:</strong> {{ selectedLoan()?.tenureMonths }} months</p>
                <p><strong>Purpose:</strong> {{ selectedLoan()?.purpose }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Status:</strong> 
                  <span [class]="'badge ' + getStatusBadgeClass(selectedLoan()?.status || '')">
                    {{ getStatusDisplay(selectedLoan()?.status || '') }}
                  </span>
                </p>
                <p><strong>Applied On:</strong> {{ selectedLoan()?.appliedOn | date: 'medium' }}</p>
                <p *ngIf="selectedLoan()?.amountApproved"><strong>Amount Approved:</strong> ₹{{ selectedLoan()?.amountApproved | number }}</p>
                <p *ngIf="selectedLoan()?.interestRate"><strong>Interest Rate:</strong> {{ selectedLoan()?.interestRate }}%</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="selectedLoan.set(null)">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Withdraw Confirmation Modal -->
    <div class="modal-overlay" *ngIf="loanToWithdraw()" (click)="loanToWithdraw.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Withdraw Application</h5>
            <button type="button" class="btn-close" (click)="loanToWithdraw.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to withdraw loan application <strong>#{{ loanToWithdraw()?.loanId }}</strong>?</p>
            <p class="text-muted">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="loanToWithdraw.set(null)">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmWithdraw()" [disabled]="withdrawing()">
              <span *ngIf="!withdrawing()">Withdraw</span>
              <span *ngIf="withdrawing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pay EMI Confirmation Modal -->
    <div class="modal-overlay" *ngIf="emiToPay()" (click)="emiToPay.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pay EMI</h5>
            <button type="button" class="btn-close" (click)="emiToPay.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Confirm payment for:</p>
            <div class="bg-light p-3 rounded">
              <p class="mb-1"><strong>Loan ID:</strong> #{{ emiToPay()?.loanId }}</p>
              <p class="mb-1"><strong>Installment:</strong> {{ emiToPay()?.installmentNo }}</p>
              <p class="mb-1"><strong>Due Date:</strong> {{ emiToPay()?.dueDate | date: 'mediumDate' }}</p>
              <p class="mb-0"><strong>Amount:</strong> ₹{{ emiToPay()?.totalEmi | number }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="emiToPay.set(null)">Cancel</button>
            <button type="button" class="btn btn-success" (click)="confirmPayEmi()" [disabled]="paying()">
              <span *ngIf="!paying()">Pay ₹{{ emiToPay()?.totalEmi | number }}</span>
              <span *ngIf="paying()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loan Application Form -->
    <app-create-service-request #loanForm></app-create-service-request>
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
    .modal-lg {
      max-width: 700px;
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
    .toast-success {
      background: #28a745;
    }
    .toast-error {
      background: #dc3545;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  @ViewChild('loanForm') loanFormComponent!: CreateServiceRequestComponent;

  myLoans = signal<Loan[]>([]);
  upcomingEmis = signal<EmiSchedule[]>([]);
  walletBalance = signal<WalletBalance | null>(null);
  loading = signal(true);
  userName = signal('');

  // Modal states
  selectedLoan = signal<Loan | null>(null);
  loanToWithdraw = signal<Loan | null>(null);
  emiToPay = signal<EmiSchedule | null>(null);

  // Loading states
  withdrawing = signal(false);
  paying = signal(false);

  // Toast
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit(): void {
    const user = this.authState.getUser();
    if (user) {
      this.userName.set(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      this.loadDashboardData(user.id);
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  loadDashboardData(userId: number): void {
    this.loading.set(true);

    this.loanApi.getMyLoans(userId).subscribe({
      next: (loans) => {
        this.myLoans.set(loans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.loanApi.getUpcomingEmis(userId).subscribe({
      next: (emis) => this.upcomingEmis.set(emis),
      error: () => this.upcomingEmis.set([])
    });

    this.loanApi.getWalletBalance(userId).subscribe({
      next: (balance) => this.walletBalance.set(balance),
      error: () => this.walletBalance.set(null)
    });
  }

  activeLoansCount(): number {
    return this.myLoans().filter(l =>
      l.status === 'DISBURSED' || l.status === 'APPROVED'
    ).length;
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

  getStatusDisplay(status: string): string {
    const displays: { [key: string]: string } = {
      'APPLIED': 'Applied',
      'UNDER_REVIEW': 'Under Review',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'DISBURSED': 'Disbursed',
      'CLOSED': 'Closed',
      'WITHDRAWN': 'Withdrawn'
    };
    return displays[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'APPLIED': 'bg-info',
      'UNDER_REVIEW': 'bg-warning',
      'APPROVED': 'bg-success',
      'REJECTED': 'bg-danger',
      'DISBURSED': 'bg-success',
      'CLOSED': 'bg-secondary',
      'WITHDRAWN': 'bg-secondary',
      'PENDING': 'bg-warning',
      'PAID': 'bg-success',
      'OVERDUE': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  showApplyLoanModal(): void {
    const user = this.authState.getUser();
    if (user) {
      this.loanFormComponent.open(() => this.loadDashboardData(user.id));
    }
  }

  viewLoanDetails(loan: Loan): void {
    this.selectedLoan.set(loan);
  }

  showWithdrawConfirm(loan: Loan): void {
    this.loanToWithdraw.set(loan);
  }

  confirmWithdraw(): void {
    const loan = this.loanToWithdraw();
    const user = this.authState.getUser();
    if (!loan || !user) return;

    this.withdrawing.set(true);
    this.loanApi.withdrawLoan(loan.loanId, user.id).subscribe({
      next: () => {
        this.withdrawing.set(false);
        this.loanToWithdraw.set(null);
        this.showToast('Loan application withdrawn successfully');
        this.loadDashboardData(user.id);
      },
      error: (err) => {
        this.withdrawing.set(false);
        this.showToast(err.message || 'Failed to withdraw loan', 'error');
      }
    });
  }

  showPayEmiConfirm(emi: EmiSchedule): void {
    this.emiToPay.set(emi);
  }

  confirmPayEmi(): void {
    const emi = this.emiToPay();
    const user = this.authState.getUser();
    if (!emi || !user) return;

    this.paying.set(true);
    // Call payment API
    this.loanApi.repayLoan({
      loanId: emi.loanId,
      userId: user.id,
      amount: emi.totalEmi,
      installmentId: emi.id,
      paymentMethod: 'WALLET'
    }).subscribe({
      next: () => {
        this.paying.set(false);
        this.emiToPay.set(null);
        this.showToast('Payment successful!');
        this.loadDashboardData(user.id);
      },
      error: (err) => {
        this.paying.set(false);
        this.showToast(err.message || 'Payment failed', 'error');
      }
    });
  }
}
