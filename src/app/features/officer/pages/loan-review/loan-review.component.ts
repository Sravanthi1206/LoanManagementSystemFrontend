import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfficerApiService } from '../../services/officer-api.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { Loan } from '../../../../shared/types/models';

@Component({
    selector: 'app-loan-review',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './loan-review.component.html',
    styleUrl: './loan-review.component.css'
})
export class LoanReviewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private officerApi = inject(OfficerApiService);
    protected loanUtils = inject(LoanUtilsService);

    loan = signal<Loan | null>(null);
    customerLoans = signal<Loan[]>([]);
    loading = signal(true);
    processing = signal(false);
    runningCreditCheck = signal(false);
    activeTab = signal<'approve' | 'reject'>('approve');

    toastMessage = signal('');
    toastType = signal<'success' | 'error'>('success');

    approveForm: FormGroup;
    rejectForm: FormGroup;

    // Interest rate ranges
    rateRanges: { [key: string]: { min: number; max: number; default: number } } = {
        'HOME': { min: 7.5, max: 12.0, default: 8.5 },
        'PERSONAL': { min: 10.0, max: 18.0, default: 12.0 },
        'VEHICLE': { min: 8.0, max: 14.0, default: 9.5 },
        'EDUCATION': { min: 8.0, max: 13.0, default: 10.0 },
        'BUSINESS': { min: 9.0, max: 16.0, default: 11.0 }
    };

    // EMI calculation
    emiPreview = signal<{ monthlyEmi: number; totalInterest: number; totalPayment: number } | null>(null);

    constructor() {
        this.approveForm = this.fb.group({
            approvedAmount: [0, [Validators.required, Validators.min(1)]],
            interestRate: [0, [Validators.required, Validators.min(0.1), Validators.max(30)]],
            tenure: [0, [Validators.required, Validators.min(1)]],
            remarks: ['']
        });

        this.rejectForm = this.fb.group({
            reason: ['', Validators.required]
        });

        // Recalculate EMI on form changes
        this.approveForm.valueChanges.subscribe(() => this.calculateEmi());
    }

    ngOnInit(): void {
        const loanId = this.route.snapshot.paramMap.get('id');
        if (loanId) {
            this.loadLoan(+loanId);
        }
    }

    loadLoan(loanId: number): void {
        this.loading.set(true);
        this.officerApi.getLoanById(loanId).subscribe({
            next: (loan) => {
                this.loan.set(loan);
                this.initializeForm(loan);
                this.loadCustomerLoans(loan.userId);
                this.loading.set(false);
            },
            error: () => {
                this.showToast('Failed to load loan details', 'error');
                this.loading.set(false);
            }
        });
    }

    loadCustomerLoans(userId: number): void {
        this.officerApi.getCustomerLoans(userId).subscribe({
            next: (response) => {
                // Exclude current loan from history
                const currentLoanId = this.loan()?.loanId;
                const otherLoans = response.content.filter(l => l.loanId !== currentLoanId);
                this.customerLoans.set(otherLoans);
            },
            error: () => this.customerLoans.set([])
        });
    }

    initializeForm(loan: Loan): void {
        const loanType = this.getLoanTypeKey(loan.type);
        const range = this.rateRanges[loanType] || { min: 8, max: 15, default: 10 };

        this.approveForm.patchValue({
            approvedAmount: loan.amountRequested,
            interestRate: range.default,
            tenure: loan.tenureMonths || 12
        });
        this.calculateEmi();
    }

    getLoanTypeKey(type: string): string {
        return type?.replace('_LOAN', '') || 'PERSONAL';
    }

    getRateRange(): { min: number; max: number } {
        const loan = this.loan();
        if (!loan) return { min: 5, max: 20 };
        const type = this.getLoanTypeKey(loan.type);
        return this.rateRanges[type] || { min: 5, max: 20 };
    }

    calculateEmi(): void {
        const { approvedAmount, interestRate, tenure } = this.approveForm.value;
        if (!approvedAmount || !interestRate || !tenure) {
            this.emiPreview.set(null);
            return;
        }

        const principal = approvedAmount;
        const monthlyRate = interestRate / 12 / 100;
        const n = tenure;

        if (monthlyRate === 0) {
            const emi = principal / n;
            this.emiPreview.set({
                monthlyEmi: Math.round(emi),
                totalInterest: 0,
                totalPayment: principal
            });
            return;
        }

        const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - principal;

        this.emiPreview.set({
            monthlyEmi: Math.round(emi),
            totalInterest: Math.round(totalInterest),
            totalPayment: Math.round(totalPayment)
        });
    }

    getCreditScoreClass(score: number): string {
        if (score >= 750) return 'excellent';
        if (score >= 650) return 'good';
        if (score >= 550) return 'fair';
        return 'poor';
    }

    getCreditScoreLabel(score: number): string {
        if (score >= 750) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Poor';
    }

    getRiskClass(risk: string): string {
        switch (risk?.toUpperCase()) {
            case 'LOW': return 'risk-low';
            case 'MEDIUM': return 'risk-medium';
            case 'HIGH': return 'risk-high';
            default: return '';
        }
    }

    showToast(message: string, type: 'success' | 'error'): void {
        this.toastMessage.set(message);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 3000);
    }

    runCreditCheck(): void {
        const loan = this.loan();
        if (!loan) return;

        this.runningCreditCheck.set(true);
        // Generate random score between 550-850
        const creditScore = Math.floor(Math.random() * 300) + 550;

        this.officerApi.performCreditCheck(loan.loanId, creditScore, 'Credit check performed via review page').subscribe({
            next: (updatedLoan) => {
                this.loan.set(updatedLoan);
                this.showToast(`Credit check complete: Score ${creditScore}`, 'success');
                this.runningCreditCheck.set(false);
            },
            error: (err) => {
                this.showToast(err.message || 'Failed to perform credit check', 'error');
                this.runningCreditCheck.set(false);
            }
        });
    }

    approveLoan(): void {
        if (this.approveForm.invalid) return;

        this.processing.set(true);
        const loan = this.loan();
        if (!loan) return;

        const { approvedAmount, interestRate, remarks } = this.approveForm.value;

        this.officerApi.approveLoan(loan.loanId, {
            approvedAmount,
            interestRate,
            remarks
        }).subscribe({
            next: () => {
                this.showToast('Loan approved successfully!', 'success');
                setTimeout(() => this.router.navigate(['/officer/dashboard']), 1500);
            },
            error: (err) => {
                this.showToast(err.message || 'Failed to approve loan', 'error');
                this.processing.set(false);
            }
        });
    }

    rejectLoan(): void {
        if (this.rejectForm.invalid) return;

        this.processing.set(true);
        const loan = this.loan();
        if (!loan) return;

        this.officerApi.rejectLoan(loan.loanId, this.rejectForm.value.reason).subscribe({
            next: () => {
                this.showToast('Loan rejected', 'success');
                setTimeout(() => this.router.navigate(['/officer/dashboard']), 1500);
            },
            error: (err) => {
                this.showToast(err.message || 'Failed to reject loan', 'error');
                this.processing.set(false);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/officer/dashboard']);
    }
}
