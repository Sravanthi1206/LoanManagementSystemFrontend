import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-create-service-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-service-request.component.html',
  styleUrl: './create-service-request.component.css'
})
export class CreateServiceRequestComponent {
  private fb = inject(FormBuilder);
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  isOpen = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  calculatedEmi = signal<number | null>(null);
  onSuccess?: () => void;
  formSubmitted = false;

  loanForm: FormGroup;

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
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loanForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitted));
  }

  open(onSuccess?: () => void): void {
    const user = this.authState.getUser();
    if (!user) {
      this.errorMessage.set('Please log in to apply for a loan.');
      return;
    }

    // Check if user has completed profile with DOB and PAN
    if (!user.dateOfBirth || !user.panCard) {
      this.errorMessage.set('Please update your profile with Date of Birth and PAN Card before applying for a loan.');
      this.isOpen.set(true);
      return;
    }

    this.isOpen.set(true);
    this.onSuccess = onSuccess;
    this.formSubmitted = false;
    this.loanForm.reset({ existingLoans: false });
    this.calculatedEmi.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  close(): void {
    const hadSuccess = !!this.successMessage();
    this.isOpen.set(false);
    this.loanForm.reset();
    this.formSubmitted = false;
    this.successMessage.set('');
    if (hadSuccess && this.onSuccess) {
      this.onSuccess();
    }
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
        this.successMessage.set(`Your loan application #${response.loanId} has been submitted successfully. We will review it and get back to you soon.`);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Unable to submit your application. Please try again.');
      }
    });
  }
}
