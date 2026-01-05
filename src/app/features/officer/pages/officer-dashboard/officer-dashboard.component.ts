import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfficerApiService } from '../../services/officer-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { Loan, DashboardStats } from '../../../../shared/types/models';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './officer-dashboard.component.html',
  styleUrl: './officer-dashboard.component.css'
})
export class OfficerDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private officerApi = inject(OfficerApiService);
  private authState = inject(AuthStateService);
  protected loanUtils = inject(LoanUtilsService);

  // Current officer info
  currentOfficerId = signal<number | null>(null);

  stats = signal<DashboardStats | null>(null);
  pendingLoans = signal<Loan[]>([]);
  underReviewLoans = signal<Loan[]>([]);
  approvedLoans = signal<Loan[]>([]);
  loanHistory = signal<Loan[]>([]);
  loading = signal(true);
  processing = signal(false);

  // Computed: My loans vs available loans
  myPendingLoans = () => this.pendingLoans().filter(l => l.assignedOfficerId === this.currentOfficerId());
  availablePendingLoans = () => this.pendingLoans().filter(l => !l.assignedOfficerId);
  myUnderReviewLoans = () => this.underReviewLoans().filter(l => l.assignedOfficerId === this.currentOfficerId());
  myApprovedLoans = () => this.approvedLoans().filter(l => l.assignedOfficerId === this.currentOfficerId());

  selectedLoan = signal<Loan | null>(null);
  creditCheckLoan = signal<Loan | null>(null);
  approveLoan = signal<Loan | null>(null);
  rejectLoan = signal<Loan | null>(null);
  disburseLoan = signal<Loan | null>(null);

  approveForm: FormGroup;
  rejectForm: FormGroup;

  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  // Interest rate ranges per loan type
  interestRateRanges: { [key: string]: { min: number; max: number; default: number } } = {
    'HOME': { min: 7.5, max: 12.0, default: 8.5 },
    'PERSONAL': { min: 10.0, max: 18.0, default: 12.0 },
    'VEHICLE': { min: 8.0, max: 14.0, default: 9.5 },
    'EDUCATION': { min: 8.0, max: 13.0, default: 10.0 },
    'BUSINESS': { min: 9.0, max: 16.0, default: 11.0 }
  };

  currentRateRange = signal({ min: 0.1, max: 30 });
  emiPreview = signal<{ monthlyEmi: number; totalInterest: number; totalPayment: number } | null>(null);

  constructor() {
    this.approveForm = this.fb.group({
      approvedAmount: [0, [Validators.required, Validators.min(1)]],
      interestRate: [0, [Validators.required, Validators.min(0.1), Validators.max(30)]],
      approvalRemarks: ['']
    });

    this.rejectForm = this.fb.group({
      rejectionReason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authState.getUser();
    if (user) {
      this.currentOfficerId.set(user.id);
    }
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
    const rateRange = this.interestRateRanges[loan.type] || { min: 5, max: 20, default: 10 };
    this.currentRateRange.set({ min: rateRange.min, max: rateRange.max });

    // Set validators with range
    this.approveForm.get('interestRate')?.setValidators([
      Validators.required,
      Validators.min(rateRange.min),
      Validators.max(rateRange.max)
    ]);
    this.approveForm.get('interestRate')?.updateValueAndValidity();

    this.approveForm.patchValue({
      approvedAmount: loan.amountRequested,
      interestRate: rateRange.default,
      approvalRemarks: ''
    });
    this.approveLoan.set(loan);
    this.calculateEmiPreview();
  }

  calculateEmiPreview(): void {
    const loan = this.approveLoan();
    if (!loan) return;

    const amount = this.approveForm.get('approvedAmount')?.value || 0;
    const rate = this.approveForm.get('interestRate')?.value || 0;
    const tenure = loan.tenureMonths || 12;

    if (amount > 0 && rate > 0 && tenure > 0) {
      const monthlyRate = rate / 12 / 100;
      const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);
      const totalPayment = emi * tenure;
      const totalInterest = totalPayment - amount;

      this.emiPreview.set({
        monthlyEmi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment)
      });
    } else {
      this.emiPreview.set(null);
    }
  }

  confirmApprove(): void {
    const loan = this.approveLoan();
    if (!loan || this.approveForm.invalid) return;

    this.processing.set(true);
    const formValue = this.approveForm.value;
    this.officerApi.approveLoan(loan.loanId, {
      approvedAmount: formValue.approvedAmount,
      interestRate: formValue.interestRate,
      remarks: formValue.approvalRemarks || 'Approved by officer'
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
    this.rejectForm.reset();
    this.rejectLoan.set(loan);
  }

  confirmReject(): void {
    const loan = this.rejectLoan();
    if (!loan || this.rejectForm.invalid) return;

    this.processing.set(true);
    this.officerApi.rejectLoan(loan.loanId, this.rejectForm.value.rejectionReason).subscribe({
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
