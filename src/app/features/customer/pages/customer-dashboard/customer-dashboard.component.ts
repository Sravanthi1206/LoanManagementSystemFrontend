import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { Loan, EmiSchedule, WalletBalance, Payment } from '../../../../shared/types/models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css'
})
export class CustomerDashboardComponent implements OnInit {
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  myLoans = signal<Loan[]>([]);
  upcomingEmis = signal<EmiSchedule[]>([]);
  walletBalance = signal<WalletBalance | null>(null);
  paymentHistory = signal<Payment[]>([]);
  walletTransactions = signal<any[]>([]);
  loading = signal(true);
  userName = signal('');
  activeTab = signal<'loans' | 'emis' | 'payments'>('loans');

  selectedLoan = signal<Loan | null>(null);
  loanToWithdraw = signal<Loan | null>(null);
  emiToPay = signal<EmiSchedule | null>(null);

  showScheduleModal = signal(false);
  emiSchedule = signal<EmiSchedule[]>([]);
  scheduleLoanId = signal<number | null>(null);
  loadingSchedule = signal(false);

  showWalletModal = signal(false);
  loadingWalletTxns = signal(false);

  withdrawing = signal(false);
  paying = signal(false);

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

    this.loanApi.getPaymentsByUser(userId).subscribe({
      next: (response) => this.paymentHistory.set(response.content || []),
      error: () => this.paymentHistory.set([])
    });
  }

  activeLoansCount(): number {
    return this.myLoans().filter(l =>
      l.status === 'DISBURSED' || l.status === 'APPROVED'
    ).length;
  }

  protected loanUtils = inject(LoanUtilsService);


  showApplyLoanModal(): void {
    this.router.navigate(['/customer/apply-loan']);
  }

  viewLoanDetails(loan: Loan): void {
    this.selectedLoan.set(loan);
  }

  viewEmiSchedule(loan: Loan): void {
    this.scheduleLoanId.set(loan.loanId);
    this.loadingSchedule.set(true);
    this.showScheduleModal.set(true);
    this.emiSchedule.set([]);

    this.loanApi.getEmiSchedule(loan.loanId).subscribe({
      next: (schedule) => {
        this.emiSchedule.set(schedule);
        this.loadingSchedule.set(false);
      },
      error: () => {
        this.loadingSchedule.set(false);
        this.showToast('Failed to load EMI schedule', 'error');
      }
    });
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

  openWalletModal(): void {
    this.showWalletModal.set(true);
    this.loadingWalletTxns.set(true);
    this.loanApi.getWalletTransactions().subscribe({
      next: (response) => {
        this.walletTransactions.set(response.content || []);
        this.loadingWalletTxns.set(false);
      },
      error: () => {
        this.loadingWalletTxns.set(false);
        this.walletTransactions.set([]);
      }
    });
  }

  goToApplyLoan(): void {
    this.router.navigate(['/customer/apply-loan']);
  }
}
