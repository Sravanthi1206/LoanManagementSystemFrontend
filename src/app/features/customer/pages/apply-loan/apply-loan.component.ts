import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
    selector: 'app-apply-loan',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './apply-loan.component.html',
    styleUrl: './apply-loan.component.css'
})
export class ApplyLoanComponent {
    private fb = inject(FormBuilder);
    private loanApi = inject(LoanApiService);
    private authState = inject(AuthStateService);
    private router = inject(Router);

    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    calculatedEmi = signal<number | null>(null);
    formSubmitted = false;
    profileIncomplete = signal(false);

    loanForm: FormGroup;

    // Loan amount ranges per type
    loanRanges: { [key: string]: { min: number; max: number } } = {
        'HOME': { min: 500000, max: 10000000 },
        'PERSONAL': { min: 50000, max: 1000000 },
        'VEHICLE': { min: 100000, max: 5000000 },
        'EDUCATION': { min: 100000, max: 3000000 },
        'BUSINESS': { min: 200000, max: 5000000 }
    };

    currentRange = signal({ min: 10000, max: 10000000 });

    constructor() {
        this.loanForm = this.fb.group({
            type: ['', Validators.required],
            amount: ['', [Validators.required, Validators.min(10000)]],
            tenure: ['', [Validators.required, Validators.min(6), Validators.max(360)]],
            purpose: ['', [Validators.required, Validators.minLength(10)]],
            employmentType: ['', Validators.required],
            monthlyIncome: ['', [Validators.required, Validators.min(10000)]],
            existingLoans: [false]
        });

        this.checkProfile();
    }

    private checkProfile(): void {
        const user = this.authState.getUser();
        if (!user) {
            this.errorMessage.set('Please log in to apply for a loan.');
            return;
        }

        if (!user.dateOfBirth || !user.panCard) {
            this.profileIncomplete.set(true);
            this.errorMessage.set('Please update your profile with Date of Birth and PAN Card before applying for a loan.');
        }
    }

    onLoanTypeChange(): void {
        const type = this.loanForm.get('type')?.value;
        if (type && this.loanRanges[type]) {
            const range = this.loanRanges[type];
            this.currentRange.set(range);
            // Update amount validators with new range
            this.loanForm.get('amount')?.setValidators([
                Validators.required,
                Validators.min(range.min),
                Validators.max(range.max)
            ]);
            this.loanForm.get('amount')?.updateValueAndValidity();
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.loanForm.get(fieldName);
        return !!(field && field.invalid && (field.touched || this.formSubmitted));
    }

    canCalculateEmi(): boolean {
        return !!(this.loanForm.get('amount')?.value && this.loanForm.get('tenure')?.value);
    }

    calculateEmi(): void {
        const amount = this.loanForm.get('amount')?.value;
        const tenure = this.loanForm.get('tenure')?.value;

        if (amount && tenure) {
            const type = this.loanForm.get('type')?.value;
            const rates: { [key: string]: number } = {
                'HOME': 8.5,
                'PERSONAL': 12.0,
                'VEHICLE': 9.5,
                'EDUCATION': 10.0,
                'BUSINESS': 11.0
            };
            const rate = rates[type] || 10.0;

            this.loanApi.calculateEmi(amount, rate, tenure).subscribe({
                next: (response) => {
                    this.calculatedEmi.set(response.monthlyEmi);
                },
                error: () => { }
            });
        }
    }

    onSubmit(): void {
        this.formSubmitted = true;
        this.errorMessage.set('');

        if (this.profileIncomplete()) {
            return;
        }

        if (this.loanForm.invalid) {
            Object.keys(this.loanForm.controls).forEach(key => {
                this.loanForm.get(key)?.markAsTouched();
            });
            this.errorMessage.set('Please fill in all required fields correctly.');
            return;
        }

        this.loading.set(true);

        const user = this.authState.getUser();
        if (!user) {
            this.errorMessage.set('Please log in to apply for a loan.');
            this.loading.set(false);
            return;
        }

        const formValue = this.loanForm.value;
        const request = {
            userId: user.id,
            userEmail: user.email,
            ...formValue,
            annualIncome: formValue.monthlyIncome * 12
        };

        this.loanApi.applyLoan(request).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.successMessage.set(`Your loan application #${response.loanId} has been submitted successfully.`);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Unable to submit your application. Please try again.');
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/customer/dashboard']);
    }
}
