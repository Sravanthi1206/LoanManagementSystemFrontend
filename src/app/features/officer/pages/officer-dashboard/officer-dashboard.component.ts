import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficerApiService } from '../../services/officer-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { Loan, DashboardStats } from '../../../../shared/types/models';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2>Loan Officer Dashboard</h2>
          <p class="text-muted">Review and process loan applications</p>
        </div>
      </div>

      <!-- Toast Notification -->
      <div *ngIf="toastMessage()" class="toast-notification" [class.toast-success]="toastType() === 'success'" [class.toast-error]="toastType() === 'error'">
        {{ toastMessage() }}
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card stat-card bg-info text-white">
            <div class="card-body">
              <h3>{{ stats()?.appliedLoans || 0 }}</h3>
              <p class="mb-0">Pending Applications</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card bg-warning text-white">
            <div class="card-body">
              <h3>{{ stats()?.underReviewLoans || 0 }}</h3>
              <p class="mb-0">Under Review</p>
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
          <div class="card stat-card bg-danger text-white">
            <div class="card-body">
              <h3>{{ stats()?.rejectedLoans || 0 }}</h3>
              <p class="mb-0">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Loans Queue -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Pending Loan Applications</h5>
            </div>
            <div class="card-body">
              <div *ngIf="loading()" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading applications...</p>
              </div>

              <div *ngIf="!loading() && pendingLoans().length === 0" class="text-center py-4">
                <p class="text-muted">No pending applications</p>
              </div>

              <div *ngIf="!loading() && pendingLoans().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Customer ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Applied On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of pendingLoans()">
                      <td>#{{ loan.loanId }}</td>
                      <td>{{ loan.userId }}</td>
                      <td>{{ getLoanTypeDisplay(loan.type) }}</td>
                      <td>₹{{ loan.amountRequested | number }}</td>
                      <td>{{ loan.appliedOn | date: 'shortDate' }}</td>
                      <td>
                        <button class="btn btn-sm btn-primary me-2" 
                                (click)="startReview(loan.loanId)"
                                [disabled]="processing()">
                          Start Review
                        </button>
                        <button class="btn btn-sm btn-outline-info"
                                (click)="viewDetails(loan)">
                          Details
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

      <!-- Under Review Loans -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Loans Under Review</h5>
            </div>
            <div class="card-body">
              <div *ngIf="underReviewLoans().length === 0" class="text-center py-4">
                <p class="text-muted">No loans under review</p>
              </div>

              <div *ngIf="underReviewLoans().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Customer ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Credit Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of underReviewLoans()">
                      <td>#{{ loan.loanId }}</td>
                      <td>{{ loan.userId }}</td>
                      <td>{{ getLoanTypeDisplay(loan.type) }}</td>
                      <td>₹{{ loan.amountRequested | number }}</td>
                      <td>
                        <span *ngIf="loan.creditScore" [class]="'badge ' + getCreditScoreBadge(loan.creditScore)">
                          {{ loan.creditScore }}
                        </span>
                        <span *ngIf="!loan.creditScore" class="text-muted">Not checked</span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-success me-1"
                                (click)="showApproveModal(loan)"
                                [disabled]="!loan.creditScore"
                                [title]="!loan.creditScore ? 'Perform credit check first' : 'Approve Loan'">
                          Approve
                        </button>
                        <button class="btn btn-sm btn-danger me-1"
                                (click)="showRejectModal(loan)">
                          Reject
                        </button>
                        <button class="btn btn-sm btn-outline-warning"
                                (click)="runCreditCheck(loan)"
                                [disabled]="!!loan.creditScore">
                          {{ loan.creditScore ? 'Checked' : 'Run Credit Check' }}
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

      <!-- Approved Loans -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Recently Approved Loans</h5>
            </div>
            <div class="card-body">
              <div *ngIf="approvedLoans().length === 0" class="text-center py-4">
                <p class="text-muted">No approved loans</p>
              </div>

              <div *ngIf="approvedLoans().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Customer ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Approved Amount</th>
                      <th>Approved On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of approvedLoans()">
                      <td>#{{ loan.loanId }}</td>
                      <td>{{ loan.userId }}</td>
                      <td>{{ getLoanTypeDisplay(loan.type) }}</td>
                      <td>₹{{ loan.amountRequested | number }}</td>
                      <td>₹{{ loan.amountApproved | number }}</td>
                      <td>{{ loan.approvedOn | date: 'shortDate' }}</td>
                      <td>
                        <button class="btn btn-sm btn-success me-1"
                                (click)="showDisburseModal(loan)"
                                [disabled]="processing()">
                          Disburse
                        </button>
                        <button class="btn btn-sm btn-outline-info"
                                (click)="viewDetails(loan)">
                          Details
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

      <!-- Loan History -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Loan History (Processed Applications)</h5>
            </div>
            <div class="card-body">
              <div *ngIf="loanHistory().length === 0" class="text-center py-4">
                <p class="text-muted">No loan history available</p>
              </div>

              <div *ngIf="loanHistory().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Customer ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of loanHistory()">
                      <td>#{{ loan.loanId }}</td>
                      <td>{{ loan.userId }}</td>
                      <td>{{ getLoanTypeDisplay(loan.type) }}</td>
                      <td>₹{{ loan.amountRequested | number }}</td>
                      <td>
                        <span [class]="'badge ' + getStatusBadge(loan.status)">
                          {{ loan.status }}
                        </span>
                      </td>
                      <td>{{ loan.appliedOn | date: 'shortDate' }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-info"
                                (click)="viewDetails(loan)">
                          Details
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
                <p><strong>Customer ID:</strong> {{ selectedLoan()?.userId }}</p>
                <p><strong>Type:</strong> {{ getLoanTypeDisplay(selectedLoan()?.type || '') }}</p>
                <p><strong>Amount Requested:</strong> ₹{{ selectedLoan()?.amountRequested | number }}</p>
                <p><strong>Tenure:</strong> {{ selectedLoan()?.tenureMonths }} months</p>
              </div>
              <div class="col-md-6">
                <p><strong>Purpose:</strong> {{ selectedLoan()?.purpose }}</p>
                <p><strong>Employment:</strong> {{ selectedLoan()?.employmentType }}</p>
                <p><strong>Monthly Income:</strong> ₹{{ selectedLoan()?.monthlyIncome | number }}</p>
                <p><strong>Applied On:</strong> {{ selectedLoan()?.appliedOn | date: 'medium' }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="selectedLoan.set(null)">Close</button>
          </div>
        </div>
      </div>
    </div>




    <!-- Credit Check Confirmation Modal -->
    <div class="modal-overlay" *ngIf="creditCheckLoan()" (click)="creditCheckLoan.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Credit Check</h5>
            <button type="button" class="btn-close" (click)="creditCheckLoan.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Run automated credit check for Loan <strong>#{{ creditCheckLoan()?.loanId }}</strong>?</p>
            <p class="text-muted small">This will fetch credit history and generate a score.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="creditCheckLoan.set(null)">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirmCreditCheck()" [disabled]="processing()">
              <span *ngIf="!processing()">Confirm Check</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- Approve Modal -->
    <div class="modal-overlay" *ngIf="approveLoan()" (click)="approveLoan.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Approve Loan #{{ approveLoan()?.loanId }}</h5>
            <button type="button" class="btn-close" (click)="approveLoan.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Approved Amount (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="approvedAmount" [placeholder]="approveLoan()?.amountRequested">
            </div>
            <div class="mb-3">
              <label class="form-label">Interest Rate (%)</label>
              <input type="number" class="form-control" [(ngModel)]="interestRate" step="0.1" placeholder="e.g., 10.5">
            </div>
            <div class="mb-3">
              <label class="form-label">Remarks</label>
              <textarea class="form-control" [(ngModel)]="approvalRemarks" rows="2" placeholder="Optional remarks"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="approveLoan.set(null)">Cancel</button>
            <button type="button" class="btn btn-success" (click)="confirmApprove()" [disabled]="!approvedAmount || !interestRate || processing()">
              <span *ngIf="!processing()">Approve</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Disburse Confirmation Modal -->
    <div class="modal-overlay" *ngIf="disburseLoan()" (click)="disburseLoan.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Disbursement</h5>
            <button type="button" class="btn-close" (click)="disburseLoan.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you ready to disburse Loan <strong>#{{ disburseLoan()?.loanId }}</strong>?</p>
            <div class="alert alert-info">
              <strong>Amount:</strong> ₹{{ disburseLoan()?.amountApproved | number }}<br>
              <strong>Interest Rate:</strong> {{ disburseLoan()?.interestRate }}%<br>
              <strong>Tenure:</strong> {{ disburseLoan()?.tenureMonths }} months
            </div>
            <p class="text-muted small">This will transfer funds to the customer and generate the EMI schedule.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="disburseLoan.set(null)">Cancel</button>
            <button type="button" class="btn btn-success" (click)="confirmDisburse()" [disabled]="processing()">
              <span *ngIf="!processing()">Confirm Disbursement</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div class="modal-overlay" *ngIf="rejectLoan()" (click)="rejectLoan.set(null)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Reject Loan #{{ rejectLoan()?.loanId }}</h5>
            <button type="button" class="btn-close" (click)="rejectLoan.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Rejection Reason <span class="text-danger">*</span></label>
              <textarea class="form-control" [(ngModel)]="rejectionReason" rows="3" placeholder="Please provide a reason for rejection"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="rejectLoan.set(null)">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmReject()" [disabled]="!rejectionReason || processing()">
              <span *ngIf="!processing()">Reject</span>
              <span *ngIf="processing()"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
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
    .toast-success { background: #28a745; }
    .toast-error { background: #dc3545; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class OfficerDashboardComponent implements OnInit {
  private officerApi = inject(OfficerApiService);
  private authState = inject(AuthStateService);

  stats = signal<DashboardStats | null>(null);
  pendingLoans = signal<Loan[]>([]);
  underReviewLoans = signal<Loan[]>([]);
  approvedLoans = signal<Loan[]>([]);
  loanHistory = signal<Loan[]>([]);
  loading = signal(true);
  processing = signal(false);

  // Modal states
  selectedLoan = signal<Loan | null>(null);
  creditCheckLoan = signal<Loan | null>(null);
  approveLoan = signal<Loan | null>(null);
  rejectLoan = signal<Loan | null>(null);
  disburseLoan = signal<Loan | null>(null);

  // Form fields
  creditScore = 0;
  creditRemarks = '';
  approvedAmount = 0;
  interestRate = 0;
  approvalRemarks = '';
  rejectionReason = '';

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
    this.loanHistory.set([]); // Reset loan history to avoid duplicates

    this.officerApi.getDashboardStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => { }
    });

    this.officerApi.getPendingLoans().subscribe({
      next: (response) => {
        this.pendingLoans.set(response.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.officerApi.getUnderReviewLoans().subscribe({
      next: (response) => this.underReviewLoans.set(response.content),
      error: () => { }
    });

    this.officerApi.getApprovedLoans().subscribe({
      next: (response) => this.approvedLoans.set(response.content),
      error: () => { }
    });

    // Load loan history (rejected + disbursed)
    this.officerApi.getRejectedLoans(0, 20).subscribe({
      next: (response) => {
        const currentHistory = this.loanHistory();
        this.loanHistory.set([...currentHistory, ...response.content]);
      },
      error: () => { }
    });

    this.officerApi.getDisbursedLoans(0, 20).subscribe({
      next: (response) => {
        const currentHistory = this.loanHistory();
        this.loanHistory.set([...currentHistory, ...response.content]);
      },
      error: () => { }
    });
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

  getCreditScoreBadge(score: number): string {
    if (score >= 750) return 'bg-success';
    if (score >= 650) return 'bg-warning';
    return 'bg-danger';
  }

  getStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'REJECTED': 'bg-danger',
      'DISBURSED': 'bg-success',
      'CLOSED': 'bg-secondary',
      'WITHDRAWN': 'bg-warning'
    };
    return badges[status] || 'bg-secondary';
  }

  viewDetails(loan: Loan): void {
    this.selectedLoan.set(loan);
  }

  startReview(loanId: number): void {
    const user = this.authState.getUser();
    if (!user) return;

    this.processing.set(true);
    this.officerApi.startReview(loanId, user.id).subscribe({
      next: () => {
        this.processing.set(false);
        this.showToast('Review started successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Failed to start review', 'error');
      }
    });
  }

  runCreditCheck(loan: Loan): void {
    if (!loan) return;
    this.creditCheckLoan.set(loan);
  }

  confirmCreditCheck(): void {
    const loan = this.creditCheckLoan();
    if (!loan) return;

    this.processing.set(true);
    this.officerApi.performCreditCheck(loan.loanId, 0, 'Automated Credit Check').subscribe({
      next: () => {
        this.processing.set(false);
        this.creditCheckLoan.set(null);
        this.showToast('Credit check completed successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Credit check failed', 'error');
      }
    });
  }

  showApproveModal(loan: Loan): void {
    this.approvedAmount = loan.amountRequested;
    this.interestRate = 10.5;
    this.approvalRemarks = '';
    this.approveLoan.set(loan);
  }

  confirmApprove(): void {
    const loan = this.approveLoan();
    if (!loan) return;

    this.processing.set(true);
    this.officerApi.approveLoan(loan.loanId, {
      approvedAmount: this.approvedAmount,
      interestRate: this.interestRate,
      remarks: this.approvalRemarks || 'Approved by officer'
    }).subscribe({
      next: () => {
        this.processing.set(false);
        this.approveLoan.set(null);
        this.showToast('Loan approved successfully');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Approval failed', 'error');
      }
    });
  }

  showRejectModal(loan: Loan): void {
    this.rejectionReason = '';
    this.rejectLoan.set(loan);
  }

  confirmReject(): void {
    const loan = this.rejectLoan();
    if (!loan) return;

    this.processing.set(true);
    this.officerApi.rejectLoan(loan.loanId, this.rejectionReason).subscribe({
      next: () => {
        this.processing.set(false);
        this.rejectLoan.set(null);
        this.showToast('Loan rejected');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Rejection failed', 'error');
      }
    });
  }

  showDisburseModal(loan: Loan): void {
    this.disburseLoan.set(loan);
  }

  confirmDisburse(): void {
    const loan = this.disburseLoan();
    if (!loan) return;

    this.processing.set(true);
    this.officerApi.disburseLoan(loan.loanId).subscribe({
      next: () => {
        this.processing.set(false);
        this.disburseLoan.set(null);
        this.showToast('Loan disbursed successfully! EMI schedule has been generated.');
        this.loadDashboardData();
      },
      error: (err) => {
        this.processing.set(false);
        this.showToast(err.message || 'Disbursement failed', 'error');
      }
    });
  }
}
