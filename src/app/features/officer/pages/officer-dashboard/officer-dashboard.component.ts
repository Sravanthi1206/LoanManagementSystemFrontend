import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficerApiService } from '../../services/officer-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { Loan, DashboardStats } from '../../../../shared/types/models';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './officer-dashboard.component.html',
  styleUrl: './officer-dashboard.component.css'
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

  selectedLoan = signal<Loan | null>(null);
  creditCheckLoan = signal<Loan | null>(null);
  approveLoan = signal<Loan | null>(null);
  rejectLoan = signal<Loan | null>(null);
  disburseLoan = signal<Loan | null>(null);

  approvedAmount = 0;
  interestRate = 0;
  approvalRemarks = '';
  rejectionReason = '';

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
    this.loanHistory.set([]);

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

  protected loanUtils = inject(LoanUtilsService);


  getCreditScoreBadge(score: number): string {
    if (score >= 750) return 'bg-success';
    if (score >= 650) return 'bg-warning';
    return 'bg-danger';
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
